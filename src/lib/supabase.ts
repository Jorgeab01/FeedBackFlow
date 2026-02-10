import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Logging para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('[Supabase Config] URL:', supabaseUrl ? '✓ Configurada' : '✗ Faltante');
  console.log('[Supabase Config] Key:', supabaseAnonKey ? '✓ Configurada' : '✗ Faltante');
}

// Validación estricta
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL no está definida');
  throw new Error('Falta la variable de entorno VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
  throw new Error('Falta la variable de entorno VITE_SUPABASE_ANON_KEY');
}

// Validar formato de URL
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('❌ VITE_SUPABASE_URL no es una URL válida:', supabaseUrl);
  throw new Error('VITE_SUPABASE_URL debe ser una URL válida');
}

// Crear cliente con configuración optimizada y TIMEOUTS EXTENDIDOS
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'feedbackflow-auth',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'feedbackflow-web'
    },
    // ⚡ CLAVE: Aumentar timeout de fetch a 30 segundos
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[Supabase] Timeout de 30s alcanzado para:', url);
        controller.abort();
      }, 30000); // 30 segundos

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Log de inicialización exitosa
if (import.meta.env.DEV) {
  console.log('✅ Cliente de Supabase inicializado correctamente');
  console.log('⏱️ Timeout configurado: 30 segundos');
}