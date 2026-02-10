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

  // 🧠 Cargar business + construir User - VERSIÓN ULTRA SIMPLE
  const hydrateUser = useCallback(async (userId: string, email: string): Promise<boolean> => {
    console.log('[hydrateUser] 🚀 Iniciando para userId:', userId);
    
    try {
      console.log('[hydrateUser] 📡 Ejecutando query a businesses...');
      
      // Query DIRECTA sin timeouts ni race conditions
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, plan, owner_id, email, is_active')
        .eq('owner_id', userId)
        .single(); // Usamos single() en vez de maybeSingle() para detectar si no existe

      console.log('[hydrateUser] 📦 Respuesta recibida');
      console.log('[hydrateUser] Data:', business);
      console.log('[hydrateUser] Error:', error);

      if (error) {
        console.error('[hydrateUser] ❌ Error al cargar business:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        setAuthState(null);
        setIsLoading(false);
        return false;
      }

      if (!business) {
        console.warn('[hydrateUser] ⚠️ Business es null');
        setAuthState(null);
        setIsLoading(false);
        return false;
      }

      console.log('[hydrateUser] ✅ Business cargado:', business.name);
      
      setAuthState({
        id: userId,
        email,
        businessId: business.id,
        businessName: business.name,
        plan: business.plan
      });
      
      setIsLoading(false);
      return true;
      
    } catch (err: any) {
      console.error('[hydrateUser] 💥 Excepción capturada:', err);
      console.error('[hydrateUser] Stack:', err.stack);
      
      setAuthState(null);
      setIsLoading(false);
      return false;
    }
  }, [setAuthState]);

  // 🔁 Restaurar sesión al montar
  useEffect(() => {
    isMountedRef.current = true;
    
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        console.log('[useAuth] 🚀 Inicializando autenticación...');
        
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[useAuth] ❌ Error en getSession:', error);
          setAuthState(null);
          setIsLoading(false);
          return;
        }

        console.log('[useAuth] 📋 Sesión obtenida:', data.session?.user?.id || 'sin sesión');

        if (data.session?.user) {
          console.log('[useAuth] 👤 Usuario encontrado, hidratando...');
          await hydrateUser(data.session.user.id, data.session.user.email!);
        } else {
          console.log('[useAuth] ℹ️ No hay sesión activa');
          setAuthState(null);
          setIsLoading(false);
        }
        
      } catch (err) {
        console.error('[useAuth] 💥 Error en init:', err);
        setAuthState(null);
        setIsLoading(false);
      }
    };

    init();

    // Escuchar cambios en el estado de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user: { id: string; email?: string } } | null) => {
        console.log('[useAuth] 🔔 Auth event:', event, session?.user?.id || 'sin usuario');
        
        if (!isMountedRef.current) return;

        try {
          if (session?.user) {
            await hydrateUser(session.user.id, session.user.email!);
          } else {
            setAuthState(null);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('[useAuth] ❌ Error en onAuthStateChange:', err);
          setAuthState(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log('[useAuth] 🧹 Cleanup');
      isMountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateUser, setAuthState]);

  // 🔐 LOGIN
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    console.log('[login] 🔐 Intentando login:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.warn('[login] ⚠️ Login fallido:', error.message);
        return false;
      }

      if (data.user) {
        console.log('[login] ✅ Login exitoso');
        await hydrateUser(data.user.id, data.user.email!);
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('[login] 💥 Excepción:', err);
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
    ): Promise<boolean> => {
      console.log('[register] 📝 Registrando:', { businessName, email, plan });
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error || !data.user) {
          console.error('[register] ❌ Error en signUp:', error);
          return false;
        }

        console.log('[register] ✅ Usuario creado, creando business...');

        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            name: businessName,
            plan,
            is_active: true,
            owner_id: data.user.id,
            email: email
          });

        if (businessError) {
          console.error('[register] ❌ Error creando business:', businessError);
          await supabase.auth.signOut();
          return false;
        }

        console.log('[register] ✅ Business creado, haciendo login...');
        const loginSuccess = await login(email, password);
        return loginSuccess;
        
      } catch (err) {
        console.error('[register] 💥 Excepción:', err);
        return false;
      }
    },
    [login]
  );

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    console.log('[logout] 🚪 Cerrando sesión...');
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