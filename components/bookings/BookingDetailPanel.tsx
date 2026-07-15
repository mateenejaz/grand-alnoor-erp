'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Tag, Users, FileText, CheckCircle, Edit, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';

interface BookingDetailPanelProps {
  booking: any;
  onClose: () => void;
  onEdit: (booking: any) => void;
}

export default function BookingDetailPanel({ booking, onClose, onEdit }: BookingDetailPanelProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabaseBrowser
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      router.refresh(); // Triggers Next.js to fetch fresh data
      onClose(); // Closes modal, calendar instantly updates visually
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status. Please try again.");
      setIsUpdating(false);
    }
  };

  const displayDate = format(new Date(booking.event_date), 'EEEE, MMMM do, yyyy');
  const createdAt = format(new Date(booking.created_at), 'MMM d, yyyy h:mm a');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 ${booking.venues?.name?.toLowerCase().includes('jts') ? 'bg-[#B8860B]' : 'bg-[#1F3864]'}`}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">Reservation Details</h2>
              <p className="text-xs text-white/80">ID: {booking.id.split('-')[0].toUpperCase()} • Logged: {createdAt}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
          
          {/* Customer & Actions Panel */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Customer / Client</p>
              {booking.customers ? (
                 <Link href={`/dashboard/customers/${booking.customer_id}`} className="text-[#1F3864] font-bold text-lg hover:underline flex items-center gap-2">
                    {booking.customers.full_name} <ExternalLink className="w-4 h-4" />
                 </Link>
              ) : (
                 <p className="text-gray-900 font-bold text-lg">Unknown Client</p>
              )}
              {booking.customers?.phone && <p className="text-sm text-gray-500 mt-0.5">{booking.customers.phone}</p>}
            </div>
            <Link href={`/dashboard/quotations/new?bookingId=${booking.id}`} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm">
               <FileText className="w-4 h-4" /> Create Quotation
            </Link>
          </div>

          {/* Event Data Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Date</p>
                <p className="text-sm font-semibold text-gray-900">{displayDate}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue Assignment</p>
                <p className="text-sm font-semibold text-gray-900">{booking.venues?.name || 'RSM Hall'}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time Slot</p>
                <p className="text-sm font-semibold text-gray-900">{booking.time_slot}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Tag className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event Classification</p>
                <p className="text-sm font-semibold text-gray-900">{booking.event_type}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guest Count</p>
                <p className="text-sm font-semibold text-gray-900">{booking.guest_count_estimate || 'Not specified'}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${booking.status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {booking.status === 'Confirmed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <p className={`text-sm font-bold ${booking.status === 'Confirmed' ? 'text-green-700' : 'text-gray-700'}`}>{booking.status}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 ml-1">Internal Notes</p>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-h-24 text-sm text-gray-700 italic">
              {booking.notes || "No additional notes provided for this reservation."}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
          <button 
            onClick={() => { onClose(); onEdit(booking); }} 
            className="px-5 py-2.5 text-sm font-bold text-[#1F3864] border-2 border-[#1F3864]/20 rounded-xl hover:bg-[#1F3864]/5 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Booking
          </button>
          
          <div className="flex gap-3">
            {isUpdating ? (
              <div className="px-6 py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </div>
            ) : (
              <>
                {booking.status === 'Tentative' && (
                  <>
                    <button onClick={() => handleStatusChange('Cancelled')} className="px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">Cancel Booking</button>
                    <button onClick={() => handleStatusChange('Confirmed')} className="px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-md">Confirm Reservation</button>
                  </>
                )}
                {booking.status === 'Confirmed' && (
                  <>
                    <button onClick={() => handleStatusChange('Cancelled')} className="px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">Cancel Booking</button>
                    <button onClick={() => handleStatusChange('Completed')} className="px-6 py-2.5 text-sm font-bold text-white bg-[#1F3864] hover:bg-[#152644] rounded-xl transition-colors shadow-md">Mark Completed</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}