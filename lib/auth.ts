import { supabase } from './supabase';

/**
 * Signs the active user completely out of their session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
  }
  // Clear layout history state back to login screen
  window.location.href = '/login';
}

/**
 * Gets the current authenticated session data.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

/**
 * Fetches the user profile info paired with their assigned operational role from the public database.
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, businesses(*)')
      .eq('auth_id', user.id)
      .single();

    if (profileError) return null;
    return profile;
  } catch {
    return null;
  }
}