import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
}).env;

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
