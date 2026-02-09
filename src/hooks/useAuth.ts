import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const initRef = useRef(false);

  const setAuthState = useCallback((nextUser: User | null) => {
    if (!isMountedRef.current) return;
    setUser(nextUser);
    setIsAuthenticated(!!nextUser);
  }, []);

  // 🧠 Cargar business + construir User
  const hydrateUser = useCallback(async (userId: string, email: string): Promise<boolean> => {
    console.log('[hydrateUser] Cargando business para userId:', userId);
    
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      console.log('[hydrateUser] Resultado:', { business, error });

      if (error) {
        console.error('[hydrateUser] Error:', error);
        // Si es error de RLS o permisos, limpiar sesión
        if (error.code === 'PGRST301' || error.code === '42501' || error.code === '404') {
          console.error('[hydrateUser] Error de RLS - limpiando sesión');
          await supabase.auth.signOut();
        }
        setAuthState(null);
        return false;
      }

      if (!business) {
        console.warn('[hydrateUser] No business encontrado para userId:', userId);
        await supabase.auth.signOut();
        setAuthState(null);
        return false;
      }

      console.log('[hydrateUser] Business cargado:', business.name);
      setAuthState({
        id: userId,
        email,
        businessId: business.id,
        businessName: business.name,
        plan: business.plan
      });
      return true;
    } catch (err: any) {
      console.error('[hydrateUser] Excepción:', err?.message || err);
      setAuthState(null);
      return false;
    }
  }, [setAuthState]);

  // 🔁 Restaurar sesión al montar
  useEffect(() => {
    isMountedRef.current = true;
    
    // Evitar doble inicialización en StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        console.log('[useAuth] Inicializando, verificando sesión...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[useAuth] Error getSession:', error);
          setAuthState(null);
          setIsLoading(false);
          return;
        }

        console.log('[useAuth] Sesión:', data.session?.user?.id || 'No hay sesión');

        if (data.session?.user) {
          const success = await hydrateUser(data.session.user.id, data.session.user.email!);
          console.log('[useAuth] hydrateUser resultado:', success);
        } else {
          setAuthState(null);
        }
      } catch (err) {
        console.error('[useAuth] Error en init:', err);
        setAuthState(null);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Escuchar cambios en el estado de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string; email?: string } } | null) => {
        console.log('[useAuth] onAuthStateChange:', event, session?.user?.id);
        
        if (!isMountedRef.current) return;

        try {
          if (session?.user) {
            await hydrateUser(session.user.id, session.user.email!);
          } else {
            setAuthState(null);
          }
        } catch (err) {
          console.error('[useAuth] Error en onAuthStateChange:', err);
          setAuthState(null);
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateUser, setAuthState]);

  // 🔐 LOGIN
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[login] Error:', error);
        return false;
      }

      if (data.user) {
        await hydrateUser(data.user.id, data.user.email!);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[login] Excepción:', err);
      return false;
    }
  }, [hydrateUser]);

  // 📝 REGISTER
  const register = useCallback(
    async (
      businessName: string,
      email: string,
      password: string,
      plan: PlanType
    ): Promise<void> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) {
          // Email ya registrado
          if (
            error.message.toLowerCase().includes('already') ||
            error.status === 422
          ) {
            throw new Error('EMAIL_EXISTS');
          }

          console.error('[register] Error signUp:', error);
          throw new Error('REGISTER_FAILED');
        }

        if (!data.user) {
          throw new Error('REGISTER_FAILED');
        }

        // Crear business (plan elegido, listo para pagos futuros)
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            name: businessName,
            plan,
            is_active: true,
            owner_id: data.user.id,
            subscription_status: 'pending' // 🔐 preparado para pagos
          });

        if (businessError) {
          console.error('[register] Error creando business:', businessError);

          // ⚠️ NO cerramos sesión aquí: el usuario existe
          // El business se puede reintentar crear o reparar
          throw new Error('BUSINESS_CREATE_FAILED');
        }

        // ✅ NO hacemos login manual
        // Supabase ya crea la sesión automáticamente
        return;
      } catch (err) {
        console.error('[register] Excepción:', err);
        throw err; // ⬅️ propagamos el error a App.tsx
      }
    },
    []
  );


  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthState(null);
  }, [setAuthState]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };
}
