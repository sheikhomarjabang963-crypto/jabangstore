import { createClient } from '@supabase/supabase-js';

const env = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
}).env;

// Trimmed defensively: a stray leading/trailing space or an accidentally
// quoted value in a hosting platform's env var UI (e.g. "https://xyz.supabase.co"
// with the quotes typed literally) is exactly what produces createClient's
// opaque "Invalid Supabase URL, must be a valid URL" error with no context.
const supabaseUrl = env.VITE_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, '');
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time.'
  );
}

let parsedUrl: URL;
try {
  parsedUrl = new URL(supabaseUrl);
} catch {
  throw new Error(
    `VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}". It must look like https://YOUR-PROJECT-REF.supabase.co (no quotes, no trailing slash issues).`
  );
}

if (parsedUrl.protocol !== 'https:') {
  throw new Error(
    `VITE_SUPABASE_URL must start with https:// (got "${parsedUrl.protocol}").`
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
