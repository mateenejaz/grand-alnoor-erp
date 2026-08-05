// Re-export the global singleton Supabase client from accounts.ts
// to prevent "Multiple GoTrueClient instances" warnings across Next.js re-renders.
export { supabase } from '@/lib/accounting/accounts';