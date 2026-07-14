import { supabase } from './supabase';

export interface VenueInput {
  business_id: string;
  name: string;
  type: string;
  capacity: number;
  description?: string;
  is_active: boolean;
}

/**
 * Fetches all venues tied to the current business ID
 */
export async function getVenues(businessId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Inserts a new venue row into the database
 */
export async function createVenue(data: VenueInput) {
  const { data: result, error } = await supabase
    .from('venues')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Updates an existing venue row
 */
export async function updateVenue(id: string, data: Partial<VenueInput>) {
  const { data: result, error } = await supabase
    .from('venues')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Instantly deactivates or activates a venue hall
 */
export async function toggleVenueActive(id: string, isActive: boolean) {
  const { data: result, error } = await supabase
    .from('venues')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}