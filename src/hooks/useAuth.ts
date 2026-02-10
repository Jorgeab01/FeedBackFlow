import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initializedRef = useRef(false);

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const hydrateUser = useCallback(
    async (authUser: { id: string; email?: string }) => {
      console.log('[hydrateUser] 🚀 start');

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, plan')
          .eq('owner_id', authUser.id)
          .maybeSingle(); // 👈 MUY IMPORTANTE

        if (error) {
          console.error('[hydrateUser] ❌ query error:', error);
          clearAuth();
          return;
        }

        if (!data) {
          console.warn('[hydrateUser] ⚠️ user sin business');
          clearAuth();
          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email!,
          businessId: data.id,
          businessName: data.name,
          plan: data.plan
        });

        setIsAuthenticated(true);
      } catch (err) {
        console.error('[hydrateUser] 💥 exception:', err);
        clearAuth();
      } finally {
        console.log('[hydrateUser] ✅ end');
        setIsLoading(false); // 👈 SIEMPRE
      }
    },
    []
  );


  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      await hydrateUser(data.session.user);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsLoading(true);
          await hydrateUser(session.user);
        } else {
          clearAuth();
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [hydrateUser]);

  // 🔐 LOGIN
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return !error;
  }, []);

  // 📝 REGISTER
  const register = useCallback(
    async (
      businessName: string,
      email: string,
      password: string,
      plan: PlanType
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error || !data.user) return false;

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
        await supabase.auth.signOut();
        return false;
      }

      return true;
    },
    []
  );

  // 🚪 LOGOUT
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout
  };
}
