import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initComplete, setInitComplete] = useState(false);
  
  // Prevenir múltiples hidraciones simultáneas
  const isHydrating = useRef(false);

  const clearAuth = useCallback(() => {
    console.log('[clearAuth] 🧹 Clearing authentication');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const hydrateUser = useCallback(
    async (authUser: { id: string; email?: string }) => {
      // Prevenir hidraciones simultáneas
      if (isHydrating.current) {
        console.log('[hydrateUser] ⏭️ Already hydrating, skipping');
        return;
      }

      isHydrating.current = true;
      console.log('[hydrateUser] 🚀 Starting hydration for:', authUser.id);

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, plan')
          .eq('owner_id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('[hydrateUser] ❌ Database error:', error);
          clearAuth();
          return;
        }

        if (!data) {
          console.warn('[hydrateUser] ⚠️ No business found for user');
          clearAuth();
          return;
        }

        console.log('[hydrateUser] ✅ Business found:', data.name);

        const newUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          businessId: data.id,
          businessName: data.name,
          plan: data.plan
        };

        // ✅ Actualizar estados de forma atómica
        setUser(newUser);
        setIsAuthenticated(true);
        
        console.log('[hydrateUser] ✅ User hydrated successfully');
      } catch (err) {
        console.error('[hydrateUser] 💥 Exception:', err);
        clearAuth();
      } finally {
        isHydrating.current = false;
      }
    },
    [clearAuth]
  );

  // ✅ INICIALIZACIÓN: Verificar sesión existente INMEDIATAMENTE
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log('[auth] 🔄 Initializing authentication...');
      
      try {
        // 1️⃣ Obtener sesión actual de Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[auth] ❌ Error getting session:', error);
          if (mounted) {
            clearAuth();
            setIsLoading(false);
            setInitComplete(true);
          }
          return;
        }

        // 2️⃣ Si hay sesión, hidratar usuario
        if (session?.user) {
          console.log('[auth] ✅ Session found, hydrating user...');
          if (mounted) {
            await hydrateUser(session.user);
          }
        } else {
          console.log('[auth] ℹ️ No active session');
          if (mounted) {
            clearAuth();
          }
        }
      } catch (err) {
        console.error('[auth] 💥 Initialization error:', err);
        if (mounted) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          console.log('[auth] ✅ Initialization complete');
          setIsLoading(false);
          setInitComplete(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [hydrateUser, clearAuth]);

  // ✅ SUSCRIPCIÓN: Escuchar cambios de autenticación
  useEffect(() => {
    // Solo suscribir después de la inicialización
    if (!initComplete) return;

    console.log('[auth] 📡 Setting up auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[auth] 📡 Auth event:', event);

        // Ignorar el evento INITIAL_SESSION ya que lo manejamos manualmente
        if (event === 'INITIAL_SESSION') {
          console.log('[auth] ⏭️ Skipping INITIAL_SESSION (already handled)');
          return;
        }

        if (event === 'SIGNED_IN') {
          console.log('[auth] ✅ SIGNED_IN event');
          if (session?.user) {
            setIsLoading(true);
            await hydrateUser(session.user);
            setIsLoading(false);
          }
        }

        if (event === 'SIGNED_OUT') {
          console.log('[auth] 👋 SIGNED_OUT event');
          clearAuth();
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('[auth] 🔄 TOKEN_REFRESHED event');
          // La sesión sigue activa, no hacer nada
        }

        if (event === 'USER_UPDATED') {
          console.log('[auth] 📝 USER_UPDATED event');
          if (session?.user) {
            await hydrateUser(session.user);
          }
        }
      }
    );

    return () => {
      console.log('[auth] 🧹 Unsubscribing from auth changes');
      subscription.unsubscribe();
    };
  }, [initComplete, hydrateUser, clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[login] 🔐 Attempting login for:', email);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('[login] ❌ Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        console.log('[login] ✅ Login successful');
        await hydrateUser(data.user);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('[login] 💥 Exception:', err);
      setIsLoading(false);
      return false;
    }
  }, [hydrateUser]);

  const register = useCallback(async (
    businessName: string,
    email: string,
    password: string,
    plan: PlanType
  ) => {
    console.log('[register] 📝 Attempting registration for:', email);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error('[register] ❌ Signup error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (!data.user) {
        console.error('[register] ❌ No user returned');
        setIsLoading(false);
        return false;
      }

      console.log('[register] ✅ User created, creating business...');

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
        console.error('[register] ❌ Business creation error:', businessError.message);
        await supabase.auth.signOut();
        setIsLoading(false);
        return false;
      }

      console.log('[register] ✅ Business created, hydrating user...');
      await hydrateUser(data.user);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[register] 💥 Exception:', err);
      setIsLoading(false);
      return false;
    }
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    console.log('[logout] 👋 Logging out...');
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      clearAuth();
    } catch (err) {
      console.error('[logout] ❌ Error during logout:', err);
      clearAuth();
    } finally {
      setIsLoading(false);
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