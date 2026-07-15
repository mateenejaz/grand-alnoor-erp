import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a function to initialize the client
const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// Use a global variable to cache the instance during Next.js Hot Reloads
// This completely prevents the "Multiple GoTrueClient instances" yellow warning
const globalForSupabase = globalThis as unknown as {
  supabaseBrowser: ReturnType<typeof createClient> | undefined;
};

export const supabaseBrowser = globalForSupabase.supabaseBrowser ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseBrowser = supabaseBrowser;
}