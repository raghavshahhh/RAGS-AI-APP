import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('mock')) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected');
} else {
  console.warn('⚠️  Supabase not configured. Memory features disabled.');
  // Mock supabase for development
  supabase = {
    from: () => ({
      insert: () => ({ error: null }),
      select: () => ({ data: [], error: null }),
      update: () => ({ error: null }),
      delete: () => ({ error: null }),
    }),
    rpc: () => ({ data: [], error: null }),
  };
}

export { supabase };

