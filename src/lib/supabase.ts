import { createClient } from '@supabase/supabase-js';

// Temporal para debug - reemplaza con tus valores reales
const url = import.meta.env.VITE_SUPABASE_URL || 'https://mdfwmnhdhbpydjjhbgxl.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZndtbmhkaGJweWRqamhiZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MjgzMjAsImV4cCI6MjA4NjAwNDMyMH0.yRYBbaSOfQcSdE74sb5sUO2f2eC-LI--mgWkabSnmmA';

if (!url || !key) {
  throw new Error('Variables de entorno faltantes');
}

export const supabase = createClient(url, key);