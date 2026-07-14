import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function checkBookingConflict(venueId: string, eventDate: string, timeSlot: string) {
  // Logic: Full Day overlaps with everything. 
  // A specific slot (like Day) overlaps with itself AND Full Day.
  const conflictingSlots = timeSlot === 'Full Day' 
    ? ['Day', 'Evening', 'Full Day'] 
    : [timeSlot, 'Full Day'];

  // Notice we STRICTLY filter by the exact venue_id. 
  // JTS Hall and RSM Hall on the same date will NEVER conflict here.
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('venue_id', venueId)
    .eq('event_date', eventDate)
    .eq('status', 'Confirmed')
    .in('time_slot', conflictingSlots);

  if (error) throw error;
  
  // If we found any rows, there is a hard conflict
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