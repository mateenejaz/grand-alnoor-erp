'use client';

import { Calendar, Tag, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface CustomerBookingHistoryProps {
  bookings: any[];
}

export default function CustomerBookingHistory({ bookings }: CustomerBookingHistoryProps) {
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Summary Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#1F3864] font-serif">Event History</h3>
          <p className="text-sm text-gray-500 mt-0.5">Comprehensive timeline of all past and future reservations.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Events</p>
            <p className="text-lg font-black text-gray-900 leading-tight">{totalBookings}</p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-200 shadow-sm text-center">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Confirmed</p>
            <p className="text-lg font-black text-green-800 leading-tight">{confirmedBookings}</p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="p-4 font-bold">Event Date</th>
              <th className="p-4 font-bold">Venue</th>
              <th className="p-4 font-bold">Classification</th>
              <th className="p-4 font-bold">Time Slot</th>
              <th className="p-4 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <Link href={`/dashboard/bookings?date=${b.event_date}`} className="font-bold text-gray-900 group-hover:text-[#1F3864] hover:underline flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(b.event_date), 'MMM d, yyyy')}
                  </Link>
                </td>
                <td className="p-4 font-semibold text-gray-700">{b.venues?.name || 'RSM Hall'}</td>
                <td className="p-4 text-sm text-gray-600 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-gray-400" /> {b.event_type}</td>
                <td className="p-4 text-sm text-gray-600">{b.time_slot}</td>
                <td className="p-4 text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                    b.status === 'Confirmed' || b.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                    b.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {b.status === 'Confirmed' || b.status === 'Completed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No reservations found for this client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}