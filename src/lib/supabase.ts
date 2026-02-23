import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('❌ Falta VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('❌ Falta VITE_SUPABASE_ANON_KEY');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    // Workaround CRITICO para un bug conocido en React 19 + Vite donde el lock de sesión local
    // hace deadlock silencioso y cuelga todas las peticiones a la base de datos y Auth.
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      try {
        return await fn();
      } catch (e) {
        console.warn('Supabase lock error bypassed:', e);
        throw e;
      }
    }
  }
});

if (import.meta.env.DEV) {
  console.log('✅ Supabase inicializado correctamente');
}

