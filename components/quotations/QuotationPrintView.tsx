'use client';

import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { calculateTotal } from '@/lib/quotations';

interface QuotationPrintViewProps {
  quotation: any;
}

export default function QuotationPrintView({ quotation }: QuotationPrintViewProps) {
  const lineItems = quotation.quotation_line_items || [];
  const grandTotal = calculateTotal(lineItems);
  
  // Safe date formatting in case the database relation is missing
  const eventDate = quotation.bookings?.event_date ? format(new Date(quotation.bookings.event_date), 'MMMM do, yyyy') : 'TBD';
  const validUntil = quotation.valid_until ? format(new Date(quotation.valid_until), 'MMMM do, yyyy') : 'TBD';

  return (
    <div className="mt-8">
      {/* Floating Action Bar - Hidden during actual printing */}
      <div className="flex justify-end mb-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Quotation
        </button>
      </div>

      {/* The Printable Document */}
      <div className="bg-white p-10 md:p-16 rounded-2xl shadow-sm border border-gray-200 mx-auto max-w-4xl print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-[#1F3864] pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#1F3864] font-serif uppercase tracking-tight">Grand Alnoor</h1>
            <p className="text-[#B8860B] font-bold tracking-widest text-sm mt-1 uppercase">Marquee & Banquet Hall</p>
            <div className="text-gray-500 text-sm mt-4 space-y-1">
              <p>123 Main Commercial Boulevard</p>
              <p>Sahiwal, Punjab, Pakistan</p>
              <p>Phone: +92 300 1234567</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-wider">Quotation</h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 text-left">
              <span className="font-bold">Quote Ref:</span> <span>{quotation.id?.split('-')[0].toUpperCase()}</span>
              <span className="font-bold">Date Issued:</span> <span>{quotation.created_at ? format(new Date(quotation.created_at), 'MMM d, yyyy') : ''}</span>
              <span className="font-bold text-[#1F3864]">Valid Until:</span> <span className="text-[#1F3864] font-bold">{validUntil}</span>
            </div>
          </div>
        </div>

        {/* Client & Event Details */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Prepared For</h3>
            <p className="font-bold text-lg text-gray-900">{quotation.customers?.full_name || 'Client Details Missing'}</p>
            <p className="text-sm text-gray-600">{quotation.customers?.phone || ''}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Event Details</h3>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <span className="text-gray-500">Date:</span> <span className="font-bold text-gray-900">{eventDate}</span>
              <span className="text-gray-500">Venue:</span> <span className="font-bold text-gray-900">{quotation.bookings?.venues?.name || 'TBD'}</span>
              <span className="text-gray-500">Timing:</span> <span className="font-bold text-gray-900">{quotation.bookings?.time_slot || 'TBD'}</span>
              <span className="text-gray-500">Guests:</span> <span className="font-bold text-gray-900">{quotation.bookings?.guest_count_estimate || 0}</span>
            </div>
          </div>
        </div>

        {/* The Financial Table */}
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-900 text-xs uppercase tracking-wider text-gray-900">
              <th className="py-3 font-bold">Description</th>
              <th className="py-3 font-bold text-center">Qty</th>
              <th className="py-3 font-bold text-right">Unit Price</th>
              <th className="py-3 font-bold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item: any, idx: number) => (
              <tr key={idx} className="text-sm">
                <td className="py-4 text-gray-900">{item.description}</td>
                <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-gray-600">PKR {Number(item.unit_price).toLocaleString()}</td>
                <td className="py-4 text-right font-bold text-gray-900">PKR {Number(item.line_total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-12">
          <div className="w-64 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 font-bold">Subtotal</span>
              <span className="text-sm font-bold">PKR {grandTotal.toLocaleString()}</span>
            </div>
            <div className="border-t-2 border-[#1F3864] mt-3 pt-3 flex justify-between items-center">
              <span className="text-base text-[#1F3864] font-black uppercase tracking-wider">Total</span>
              <span className="text-xl text-[#1F3864] font-black">PKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</h3>
          <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed max-w-2xl">{quotation.notes}</p>
        </div>

        {/* Signature Area */}
        <div className="mt-16 grid grid-cols-2 gap-24 pt-10">
          <div className="border-t border-gray-300 pt-2 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            Authorised Signature (Grand Alnoor)
          </div>
          <div className="border-t border-gray-300 pt-2 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            Client Acceptance Signature
          </div>
        </div>
      </div>
    </div>
  );
}