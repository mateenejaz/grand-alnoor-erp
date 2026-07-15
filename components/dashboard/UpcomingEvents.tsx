import { format } from 'date-fns';
import { CalendarClock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpcomingEventsProps {
  events: any[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <CalendarClock className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Upcoming Events</h3>
        <p className="text-sm text-gray-500 mt-1">There are no confirmed bookings in the near future.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-[#1F3864] px-6 py-4 flex justify-between items-center text-white shrink-0">
        <h2 className="font-serif font-bold text-lg">Upcoming Events</h2>
        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Next 10 Confirmed</span>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
              <th className="p-4 font-bold">Event Date & Time</th>
              <th className="p-4 font-bold">Venue</th>
              <th className="p-4 font-bold">Client / Event Type</th>
              <th className="p-4 font-bold text-right">Guests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{format(new Date(event.event_date), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{event.time_slot}</p>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#B8860B]/10 text-[#B8860B]">
                    {event.venues?.name || 'TBD'}
                  </span>
                </td>
                <td className="p-4">
                  <Link href={`/dashboard/bookings?date=${format(new Date(event.event_date), 'yyyy-MM-dd')}`} className="font-bold text-[#1F3864] hover:underline flex items-center gap-1 w-fit">
                    {event.customers?.full_name} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{event.event_type}</p>
                </td>
                <td className="p-4 text-right">
                  <span className="font-bold text-gray-600">{event.guest_count_estimate}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}