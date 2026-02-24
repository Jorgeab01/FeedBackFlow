import { useEffect, useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (businessName: string, email: string, password: string) => Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hydratingRef = useRef<string | null>(null);
  const lastHydratedUserId = useRef<string | null>(null);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    lastHydratedUserId.current = null;

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

  const hydrateUser = useCallback(async (authUser: SupabaseUser, explicitToken?: string): Promise<void> => {
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
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey,
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

      lastHydratedUserId.current = authUser.id;

      const rawMetaData = authUser.user_metadata || {};
      const requiresPlanSelection = rawMetaData.requires_plan_selection === true;

      const mergedUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        businessId: businessData?.id || '',
        businessName: businessData?.name || 'Configurando Negocio...',
        plan: businessData?.plan || 'free',
        requiresPlanSelection,
      };
      setUser(mergedUser);
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
          // FIX: Solo hidratamos si no hemos hidratado ya a este usuario, evitando bucles de navegación
          if (lastHydratedUserId.current !== session.user.id) {
            await hydrateUser(session.user, session.access_token);
          }
        } finally {
          // FIX: setIsLoading(false) siempre se ejecuta, incluso si hydrateUser salió por su guarda interna
          if (mounted) setIsLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // En TOKEN_REFRESHED no re-hidratamos: solo actualizamos requiresPlanSelection
        // si el nuevo token ya tiene el flag limpiado (evita el bucle con metadata stale)
        if (lastHydratedUserId.current === session.user.id) {
          const rawMetaData = session.user.user_metadata || {};
          const requiresPlanSelection = rawMetaData.requires_plan_selection === true;
          // Solo actualizamos si el flag cambió a false (limpieza exitosa)
          if (!requiresPlanSelection) {
            setUser(prev => prev ? { ...prev, requiresPlanSelection: false } : null);
          }
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
  }, [hydrateUser, clearAuth]);

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

      if (error && error.message.includes('Email not confirmed')) {
        toast.error('Correo sin verificar', {
          description: 'El enlace temporal pudo haber caducado. Revisa tu correo o solicita uno nuevo.',
          duration: 10000,
          action: {
            label: 'Reenviar correo',
            onClick: async () => {
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                  emailRedirectTo: window.location.origin + '/dashboard'
                }
              });
              if (resendError) {
                toast.error('Error al reenviar', { description: resendError.message });
              } else {
                toast.success('¡Enlace reenviado!', { description: 'Revisa tu bandeja de entrada en unos instantes.' });
              }
            }
          }
        });
        return false;
      }

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

  const register = useCallback(async (businessName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { businessName, plan: 'free', requires_plan_selection: true },
          emailRedirectTo: `${window.location.origin}/email-verified`
        }
      });

      console.log('[auth] Registro result:', { data, error });

      if (error) {
        console.error('[auth] Error registering:', error);
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return { success: false, error: 'No se creó el usuario nativo en Supabase' };
      }

      const requiresEmailVerification = data.user && !data.session;
      if (!requiresEmailVerification) {
        await hydrateUser(data.user, data.session?.access_token);
      }
      return { success: true, requiresEmailVerification };
    } catch (err: any) {
      console.error('[auth] Catch error registering:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUser]);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-verified`
        }
      });
      if (error) {
        console.error('[auth] Error resending verification:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[auth] Catch error resending verification:', err);
      return { success: false, error: err.message };
    }
  }, []);

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
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoading, login, loginWithGoogle,
      register,
      resendVerification,
      logout,
      updateUser
    }}
    >  {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}