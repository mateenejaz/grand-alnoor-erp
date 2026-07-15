import { createClient } from '@/lib/supabase-server';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import { CalendarRange } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let finalizedBookings: any[] = [];
  let businessId = '';
  let venuesList: any[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_id', user.id)
      .single();

    if (profile?.business_id) {
      businessId = profile.business_id;

      // Notice we now fetch customers attached to the booking!
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, customers(id, full_name, phone)')
        .eq('business_id', businessId);

      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name')
        .eq('business_id', businessId);

      if (venuesData) {
        venuesList = venuesData;
      }

      if (bookingsData && venuesData) {
        finalizedBookings = bookingsData.map((booking: any) => {
          const targetVenue = venuesData.find((v: any) => v.id === booking.venue_id);
          return {
            ...booking,
            venues: {
              name: targetVenue ? targetVenue.name : 'RSM Hall'
            }
          };
        });
      }
    }
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1F3864]/5 rounded-xl text-[#1F3864]">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1F3864] font-serif">Reservations Calendar</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Visualize, orchestrate, and check slot distributions for independent halls.
            </p>
          </div>
        </div>
      </div>

      <BookingCalendar 
        initialBookings={finalizedBookings} 
        businessId={businessId} 
        venues={venuesList} 
      />
    </div>
  );
}