import { useEffect, useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (businessName: string, email: string, password: string, plan: PlanType) => Promise<{ success: boolean; requiresEmailVerification?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely execute Supabase promises without hanging infinitely
const withTimeout = async function (promise: any, ms: number, fallbackErrorMsg: string): Promise<any> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<any>((_, reject) => setTimeout(() => reject(new Error(fallbackErrorMsg)), ms))
  ]);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hydratingRef = useRef<string | null>(null);
  const initDispatched = useRef(false);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);

    // Purge tokens and potentially corrupted PKCE code verifiers that cause internal Supabase locks
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('feedbackflow-auth') || (key.startsWith('sb-') && key.endsWith('-auth-token')))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[auth] Could not clear localStorage tokens:', e);
    }
  }, []);

  const hydrateUser = useCallback(async (authUser: { id: string; email?: string }): Promise<void> => {
    if (hydratingRef.current === authUser.id) return;
    hydratingRef.current = authUser.id;

    try {
      // Used withTimeout because Supabase DB queries hang infinitely if the client is internally locked by a bad OAuth ?code=
      const { data, error } = await withTimeout(
        supabase.from('businesses').select('id, name, plan').eq('owner_id', authUser.id).maybeSingle(),
        8000,
        'DB query timeout during hydration'
      );

      if (error) {
        console.error('[auth] Error fetching business:', error);
        clearAuth();
        return;
      }

      const businessData = data || {
        id: '',
        name: 'Configurando Negocio...',
        plan: 'none'
      };

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        businessId: businessData.id,
        businessName: businessData.name,
        plan: businessData.plan
      });
      setIsAuthenticated(true);

      // Clean URL natively
      if (window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err) {
      console.error('[auth] Exception in hydrateUser:', err);
      clearAuth();
    } finally {
      hydratingRef.current = null;
    }
  }, [clearAuth]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (initDispatched.current) return;
      initDispatched.current = true;

      try {
        // withTimeout is required because getSession() inherently hangs in @supabase/supabase-js
        // if there is a mismatch/corruption in the PKCE localStorage verifier vs the ?code= parameter.
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          10000,
          'getSession timeout'
        );

        const { data: { session }, error } = sessionResult;

        if (error) {
          console.error("[auth] Session error during init:", error);
          if (window.location.search.includes('code=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          clearAuth();
        } else if (session?.user) {
          await hydrateUser(session.user);
        } else {
          clearAuth();
        }
      } catch (e) {
        console.error("[auth] Hard error or timeout during init:", e);
        // If we timeout while exchanging a code, it means the code is dead and the client is locked.
        // We MUST purge auth aggressively to break the infinite lock loop.
        clearAuth();
        if (window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        if (!user || user.id !== session.user.id) {
          await hydrateUser(session.user);
        }
        if (mounted) setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser, clearAuth, user]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        }
      });
      if (error) {
        console.error('Google login error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Google login exception:', err);
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return false;
      if (data.user) {
        await hydrateUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login exception:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUser]);

  const register = useCallback(async (businessName: string, email: string, password: string, plan: PlanType) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { businessName, plan } }
      });
      if (error || !data.user) return { success: false };

      const requiresEmailVerification = data.user && !data.session;
      if (!requiresEmailVerification) {
        await hydrateUser(data.user);
      }
      return { success: true, requiresEmailVerification };
    } catch (err) {
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    clearAuth();
    setIsLoading(true);
    try {
      await withTimeout(supabase.auth.signOut({ scope: 'local' }), 3000, 'Logout timeout');
    } catch (err) {
      console.warn('Logout warning:', err);
    } finally {
      setIsLoading(false);
      window.location.replace('/login');
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, loginWithGoogle, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
