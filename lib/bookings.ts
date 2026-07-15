import { supabaseBrowser as supabase } from './supabase-client';

export async function checkBookingConflict(venueId: string, eventDate: string, timeSlot: string) {
  // Logic: Full Day overlaps with everything. 
  // A specific slot (like Day) overlaps with itself AND Full Day.
  const conflictingSlots = timeSlot === 'Full Day' 
    ? ['Day', 'Evening', 'Full Day'] 
    : [timeSlot, 'Full Day'];

  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('venue_id', venueId)
    .eq('event_date', eventDate)
    .eq('status', 'Confirmed')
    .in('time_slot', conflictingSlots);

  if (error) throw error;
  
  return data && data.length > 0;
}

export async function createBooking(bookingData: any) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  if (error) throw error;
  return data;
}