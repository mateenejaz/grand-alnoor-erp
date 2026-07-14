'use client';

import { useState } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Calendar, User, Clock, Tag, X } from 'lucide-react';
import NewBookingModal from './NewBookingModal';

interface BookingCalendarProps {
  initialBookings: any[];
  businessId: string;
  venues: any[];
}

export default function BookingCalendar({ initialBookings, businessId, venues }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [modalType, setModalType] = useState<'create' | 'view' | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDayClick = (date: Date) => {
    setSelectedDateStr(format(date, 'yyyy-MM-dd'));
    setModalType('create'); // Triggers NewBookingModal
  };

  const handleEventClick = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setModalType('view');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] relative">
      
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#1F3864] font-serif">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1 ml-4">
            <button type="button" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button type="button" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Color Legends */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#1F3864] rounded" />
            <span className="text-gray-600">RSM Hall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#B8860B] rounded" />
            <span className="text-gray-600">JTS Hall</span>
          </div>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 border border-dashed border-gray-400 bg-gray-50 rounded text-[10px]">Dashed</span>
            <span className="text-gray-500">Tentative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 border border-solid border-gray-400 bg-gray-50 rounded text-[10px]">Solid</span>
            <span className="text-gray-500">Confirmed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 bg-white text-center text-xs font-bold uppercase tracking-wider text-gray-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-3 border-r border-gray-50 last:border-r-0">{d}</div>)}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-gray-50 divide-x divide-y divide-gray-100">
        {days.map((day, idx) => {
          const stringifiedDateKey = format(day, 'yyyy-MM-dd');
          const dayBookings = (initialBookings || []).filter(b => {
            if (!b.event_date) return false;
            return b.event_date.split('T')[0].split(' ')[0] === stringifiedDateKey;
          });
          const isCurrentMonth = format(day, 'MM') === format(currentDate, 'MM');

          return (
            <div
              key={day.toString() + idx}
              onClick={() => handleDayClick(day)}
              className={`bg-white p-2 min-h-24 flex flex-col relative group transition-colors hover:bg-gray-50/80 cursor-pointer ${!isCurrentMonth ? 'opacity-40 bg-gray-50/30' : ''}`}
            >
              <span className={`text-xs font-bold mb-1 block w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-[#1F3864] text-white' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>

              <div className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] pr-0.5 z-10">
                {dayBookings.map((booking) => {
                  const venueName = booking.venues?.name || '';
                  const isJTS = venueName.toLowerCase().includes('jts');
                  const bgStyle = isJTS ? 'bg-[#B8860B] text-white' : 'bg-[#1F3864] text-white';
                  const outlineStyle = booking.status === 'Confirmed' ? 'border border-solid border-black/10' : 'border-2 border-dashed border-white/60 shadow-sm';

                  return (
                    <div
                      key={booking.id}
                      onClick={(e) => handleEventClick(e, booking)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold leading-tight flex flex-col truncate transform hover:scale-[1.03] transition-transform shadow-sm ${bgStyle} ${outlineStyle}`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>{venueName || 'RSM Hall'}</span>
                        <span className="opacity-75 text-[9px] uppercase tracking-tighter bg-black/10 px-1 rounded">{booking.time_slot ? booking.time_slot[0] : 'E'}</span>
                      </div>
                      <div className="opacity-90 text-[10px] truncate mt-0.5">{booking.time_slot || 'Evening'} • {booking.event_type || 'Wedding'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-gray-300 transition-opacity">
                <PlusCircle className="w-4 h-4 text-[#1F3864]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* REAL NEW BOOKING MODAL */}
      {modalType === 'create' && (
        <NewBookingModal 
          businessId={businessId}
          venues={venues}
          selectedDateStr={selectedDateStr}
          onClose={() => setModalType(null)} 
        />
      )}

      {/* VIEW MODAL (UNCHANGED) */}
      {modalType === 'view' && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className={`px-6 py-4 text-white flex justify-between items-center ${selectedBooking.venues?.name?.toLowerCase().includes('jts') ? 'bg-[#B8860B]' : 'bg-[#1F3864]'}`}>
              <h3 className="font-serif font-bold text-base">Event Records Log</h3>
              <button type="button" onClick={() => setModalType(null)} className="text-gray-100 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Calendar className="w-4 h-4" /></div>
                  <div><span className="text-xs text-gray-400 block font-normal">Event Date</span>{selectedBooking.event_date}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><User className="w-4 h-4" /></div>
                  <div><span className="text-xs text-gray-400 block font-normal">Venue Assigned</span>{selectedBooking.venues?.name || 'RSM Hall'}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Clock className="w-4 h-4" /></div>
                  <div><span className="text-xs text-gray-400 block font-normal">Timing Window</span>{selectedBooking.time_slot}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Tag className="w-4 h-4" /></div>
                  <div><span className="text-xs text-gray-400 block font-normal">Classification & Status</span>{selectedBooking.event_type} — <strong>{selectedBooking.status}</strong></div>
                </div>
              </div>
              <button type="button" onClick={() => setModalType(null)} className="w-full mt-2 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-xl transition-all shadow-md">
                Close Records Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}