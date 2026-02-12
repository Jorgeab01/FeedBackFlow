import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, PlanType } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const hydrateUser = useCallback(
    async (authUser: { id: string; email?: string }) => {
      console.log('[hydrateUser] 🚀 start');

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, plan')
          .eq('owner_id', authUser.id)
          .maybeSingle();

        if (error || !data) {
          console.warn('[hydrateUser] ⚠️ no business', error);
          clearAuth();
          setIsLoading(false);
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
        console.error('[hydrateUser] 💥 exception', err);
        clearAuth();
      } finally {
        console.log('[hydrateUser] ✅ end');
        setIsLoading(false);
      }
    },
    [clearAuth]
  );

  useEffect(() => {
    let isMounted = true;

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[auth] event:', event);

        if (!isMounted) return;

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await hydrateUser(session.user);
          } else {
            clearAuth();
            setIsLoading(false);
          }
        }

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            await hydrateUser(session.user);
          }
        }

        if (event === 'SIGNED_OUT') {
          clearAuth();
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrateUser, clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }, []);

  const register = useCallback(async (
    businessName: string,
    email: string,
    password: string,
    plan: PlanType
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
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
      console.error('Error creating business:', businessError);
      await supabase.auth.signOut();
      return false;
    }

    await hydrateUser(data.user);
    return true;
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    clearAuth();
    setIsLoading(false);
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