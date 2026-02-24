import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('❌ Falta VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('❌ Falta VITE_SUPABASE_ANON_KEY');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      apikey: supabaseAnonKey,
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    ...(import.meta.env.DEV ? {
      // Dev-only lock bypass para evitar que React 19 Strict Mode congele getSession()
      lock: async <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => await fn()
    } : {})
  }
});

if (import.meta.env.DEV) {
  console.log('✅ Supabase inicializado correctamente');
}

