import { useEffect, useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
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
        if (key && (key.includes('feedbackflow-auth') || key.startsWith('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[auth] Could not clear localStorage tokens:', e);
    }
  }, []);

  const hydrateUser = useCallback(async (authUser: { id: string; email?: string }, explicitToken?: string): Promise<void> => {
    if (hydratingRef.current === authUser.id) return;
    hydratingRef.current = authUser.id;

    try {
      console.log(`[auth][verbose] Starting DB fetch for user: ${authUser.id}`);

      let businessData = null;
      let error = null;

      if (explicitToken) {
        // Native Fetch Bypass: Evita el 100% de los internal lock deadlocks de supabase.from()
        // enviando la petición REST pura al backend sin pasar por la cola maldita de GoTrue.
        console.log(`[auth][verbose] Fetching natively via REST API...`);
        const response = await fetch(`${supabaseUrl}/rest/v1/businesses?owner_id=eq.${authUser.id}&select=id,name,plan`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${explicitToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const rawData = await response.json();
        businessData = rawData && rawData.length > 0 ? rawData[0] : null;
      } else {
        // Fallback
        const { data: sbData, error: sbError } = await supabase
          .from('businesses')
          .select('id, name, plan')
          .eq('owner_id', authUser.id)
          .maybeSingle();
        businessData = sbData;
        error = sbError;
      }

      console.log(`[auth][verbose] DB fetch resolved:`, { hasData: !!businessData, hasError: !!error });

      if (error) {
        console.error('[auth] Error fetching business:', error);
        clearAuth();
        return;
      }

      // Si no existe, usamos un mock por defecto en lugar de colgar
      businessData = businessData || {
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
    } catch (err: any) {
      console.error('[auth] Exception in hydrateUser:', err);
      // Auto-Heal: Autodestrucción completa de la caché si detectamos un deadlock nativo
      if (err?.message === 'SUPABASE_DEADLOCK_DETECTED') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/login');
      }
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

      const hasOAuthCode = window.location.search.includes('code=');

      if (hasOAuthCode) {
        // En flujos OAuth, Supabase (detectSessionInUrl) ya está procesando el código en 2º plano.
        // Llamar a getSession() aquí crea una Condición de Carrera PKCE (doble uso del mismo token)
        // provocando cuelgues masivos de 30s o borrados accidentales de sesión.
        // Dejamos que el listener onAuthStateChange("SIGNED_IN") tome el control orgánicamente.

        // FIX: Safety timeout por si el listener nunca se dispara (red lenta, error Supabase, etc.)
        const safetyTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[auth] Safety timeout: onAuthStateChange no se disparó tras OAuth. Reseteando.');
            clearAuth();
            setIsLoading(false);
          }
        }, 10000);
        (window as any).__authSafetyTimeout = safetyTimeout;
        return;
      }

      try {
        // Ejecutar obtención nativa de sesión y confiar en el tiempo de respuesta subyacente de Supabase
        const sessionResult = await supabase.auth.getSession();

        const { data: { session }, error } = sessionResult;

        if (error) {
          console.error("[auth] Session error during init:", error);
          if (window.location.search.includes('code=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          clearAuth();
        } else if (session?.user) {
          await hydrateUser(session.user, session.access_token);
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
        // Cancelar el safety timeout si el listener se dispara correctamente
        if ((window as any).__authSafetyTimeout) {
          clearTimeout((window as any).__authSafetyTimeout);
          (window as any).__authSafetyTimeout = null;
        }
        try {
          // FIX: Siempre hidratar en SIGNED_IN. La condición anterior (!user || user.id !== ...)
          // podía saltar el bloque entero y nunca ejecutar setIsLoading(false), dejando la app colgada.
          await hydrateUser(session.user, session.access_token);
        } finally {
          // FIX: setIsLoading(false) siempre se ejecuta, incluso si hydrateUser salió por su guarda interna
          if (mounted) setIsLoading(false);
        }
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
        await hydrateUser(data.user, data.session?.access_token);
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
        await hydrateUser(data.user, data.session?.access_token);
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
      await supabase.auth.signOut({ scope: 'local' });
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