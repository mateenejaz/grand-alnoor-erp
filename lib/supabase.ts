// Import the necessary function from the Supabase package to initialize a connection
import { createClient } from '@supabase/supabase-js';

// Read the public Supabase URL string that you saved inside your hidden .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Read the public anonymous API key string that you saved inside your hidden .env.local file
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check to make sure both variables are actually found before trying to connect
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing! Check your .env.local file.');
}

// Build and export a working connection instance that your application can use to talk to your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);