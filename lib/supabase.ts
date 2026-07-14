// Import createBrowserClient from the SSR package so it manages cookies automatically
import { createBrowserClient } from '@supabase/ssr';

// Read your hidden Supabase project URL credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Read your hidden Supabase public anonymous security key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Build and export a browser client that securely syncs login cookies with your Next.js middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);