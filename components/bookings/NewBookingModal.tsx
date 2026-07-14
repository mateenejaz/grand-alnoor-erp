'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import CustomerSearch from './CustomerSearch';
import { checkBookingConflict, createBooking } from '@/lib/bookings';
import { createCustomer } from '@/lib/customers';
import { useRouter } from 'next/navigation';

interface NewBookingModalProps {
  businessId: string;
  selectedDateStr: string;
  venues: any[];
  onClose: () => void;
}

export default function NewBookingModal({ businessId, selectedDateStr, venues, onClose }: NewBookingModalProps) {
  const router = useRouter();
  
  // Form State
  const [venueId, setVenueId] = useState(venues[0]?.id || '');
  const [timeSlot, setTimeSlot] = useState('Evening');
  const [eventType, setEventType] = useState('Wedding');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Tentative');
  
  const [customerPayload, setCustomerPayload] = useState<any>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayDate = format(new Date(selectedDateStr), 'EEEE, MMMM do, yyyy');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!venueId || !customerPayload) {
      setError('Please select a venue and attach a customer.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. CONFLICT VALIDATION (Only applies if saving as Confirmed)
      if (status === 'Confirmed') {
        const hasConflict = await checkBookingConflict(venueId, selectedDateStr, timeSlot);
        if (hasConflict) {
          const venueName = venues.find(v => v.id === venueId)?.name || 'This Venue';
          setError(`${venueName} is already confirmed for ${selectedDateStr} [${timeSlot}]. Please choose a different date, time slot, or venue.`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. CREATE CUSTOMER IF NEW
      let finalCustomerId = customerPayload.id;
      if (customerPayload.newCustomerData) {
        const createdCust = await createCustomer({
          ...customerPayload.newCustomerData,
          business_id: businessId
        });
        finalCustomerId = createdCust.id;
      }

      // 3. CREATE THE BOOKING
      await createBooking({
        business_id: businessId,
        venue_id: venueId,
        customer_id: finalCustomerId,
        event_date: selectedDateStr,
        time_slot: timeSlot,
        event_type: eventType,
        guest_count_estimate: guestCount ? parseInt(guestCount) : 0,
        notes: notes || null,
        status: status
      });

      // 4. SUCCESS - Refresh page server data & close
      router.refresh();
      onClose();

    } catch (err: any) {
      console.error(err);
      setError('A system error occurred while saving the booking.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1F3864] px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><CalendarIcon className="w-5 h-5" /></div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">New Reservation</h2>
              <p className="text-xs text-blue-200">{displayDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-800 leading-snug">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Venue Assignment</label>
                  <select 
                    value={venueId} 
                    onChange={e => setVenueId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Time Slot</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    {['Day', 'Evening', 'Full Day'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          timeSlot === slot ? 'bg-white shadow-sm text-[#1F3864]' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Event Classification</label>
                  <select 
                    value={eventType} 
                    onChange={e => setEventType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
                  >
                    <option value="Wedding">Wedding (Baraat)</option>
                    <option value="Walima">Walima</option>
                    <option value="Mehndi">Mehndi</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Corporate">Corporate / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Guest Count Estimate</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 350"
                    value={guestCount}
                    onChange={e => setGuestCount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" 
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5 flex flex-col">
                <CustomerSearch businessId={businessId} onCustomerReady={setCustomerPayload} />

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Reservation Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('Tentative')}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex flex-col items-center justify-center transition-all ${
                        status === 'Tentative' ? 'border-gray-800 bg-gray-50 text-gray-900' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span>Tentative</span>
                      <span className="text-[10px] font-normal opacity-70">Hold date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Confirmed')}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-bold flex flex-col items-center justify-center transition-all ${
                        status === 'Confirmed' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span>Confirmed</span>
                      <span className="text-[10px] font-normal opacity-70">Locks calendar</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Internal Notes</label>
                  <textarea 
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Menu preferences, stage requests..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] resize-none" 
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            form="booking-form"
            disabled={isSubmitting || !customerPayload}
            className="px-8 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}