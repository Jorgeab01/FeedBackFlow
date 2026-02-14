import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs para controlar el estado interno sin causar re-renders
  const isInitializing = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const hydrateUser = useCallback(async (authUser: { id: string; email?: string }): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, plan')
        .eq('owner_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business:', error);
        return false;
      }

      if (!data) {
        console.warn('No business found for user');
        return false;
      }

      const newUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        businessId: data.id,
        businessName: data.name,
        plan: data.plan
      };

      setUser(newUser);
      setIsAuthenticated(true);
      retryCount.current = 0; // Resetear contador de retries al tener éxito
      return true;
    } catch (err) {
      console.error('Exception in hydrateUser:', err);
      return false;
    }
  }, []);

  // Función de inicialización con retry
  const initializeAuth = useCallback(async () => {
    // Evitar múltiples inicializaciones simultáneas
    if (isInitializing.current) {
      console.log('[auth] Initialization already in progress, skipping...');
      return;
    }

    isInitializing.current = true;
    setIsLoading(true);

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (session?.user) {
        const success = await hydrateUser(session.user);
        if (!success) {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    } catch (err: any) {
      // Manejar específicamente AbortError
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn('[auth] Request aborted, retrying...', retryCount.current);
        
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          // Esperar un poco antes de retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          isInitializing.current = false; // Permitir nueva intento
          return initializeAuth(); // Retry recursivo
        }
      }
      
      console.error('[auth] Initialization error:', err);
      clearAuth();
    } finally {
      setIsLoading(false);
      // Delay antes de permitir nueva inicialización (evita dobles llamadas)
      setTimeout(() => {
        isInitializing.current = false;
      }, 500);
    }
  }, [hydrateUser, clearAuth]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // Inicializar solo si no hay usuario cargado
    if (!user && !isInitializing.current) {
      initializeAuth();
    }

    // Suscribirse a cambios de auth
    const setupSubscription = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log('[auth] Event:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await hydrateUser(session.user);
          } else if (event === 'SIGNED_OUT') {
            clearAuth();
          }
          // Ignorar INITIAL_SESSION y TOKEN_REFRESHED para evitar loops
        }
      );
      authSubscription = subscription;
    };

    // Delay la suscripción para evitar conflictos con la inicialización
    const timer = setTimeout(setupSubscription, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      authSubscription?.unsubscribe();
    };
  }, [initializeAuth, hydrateUser, clearAuth, user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error);
        return false;
      }

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

  const register = useCallback(async (
    businessName: string,
    email: string,
    password: string,
    plan: PlanType
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error || !data.user) {
        console.error('Signup error:', error);
        return false;
      }

      const { error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          email,
          plan,
          owner_id: data.user.id,
          is_active: true
        });

      if (businessError) {
        console.error('Business creation error:', businessError);
        await supabase.auth.signOut();
        return false;
      }

      await hydrateUser(data.user);
      return true;
    } catch (err) {
      console.error('Register exception:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAuth();
    } catch (err) {
      console.error('Logout error:', err);
      clearAuth();
    }
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };
}