'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Send, Trash2, UtensilsCrossed } from 'lucide-react';
import { format } from 'date-fns';
import { supabaseBrowser as supabase } from '@/lib/supabase-client';
import CustomMenuSelector from './CustomMenuSelector';

interface QuotationBuilderProps {
  businessId: string;
  booking?: any;
  packages: any[];
  existingQuotation?: any;
}

export default function QuotationBuilder({ businessId, booking, packages, existingQuotation }: QuotationBuilderProps) {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<any[]>(existingQuotation?.quotation_line_items || []);
  const [notes, setNotes] = useState(existingQuotation?.notes || '50% advance payment required to lock the date.\nRemaining balance due 3 days prior to the event.');
  const [validUntil, setValidUntil] = useState(existingQuotation?.valid_until ? format(new Date(existingQuotation.valid_until), 'yyyy-MM-dd') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomMenuOpen, setIsCustomMenuOpen] = useState(false);

  const guestCount = booking?.guest_count_estimate || 0;

  // Real-time Total Math
  const grandTotal = lineItems.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);

  const handleAddVenueCharge = () => {
    if (!booking?.venues) return alert("No venue attached to this booking.");
    const price = Number(booking.venues.base_price) || 0;
    setLineItems([...lineItems, {
      description: `Venue Rental - ${booking.venues.name}`,
      quantity: 1,
      unit_price: price,
      line_total: price
    }]);
  };

  const handleAddPackage = () => {
    if (packages.length === 0) return alert("No packages found.");
    const defaultPackage = packages[0];
    const price = Number(defaultPackage.price_per_head) || 0;
    setLineItems([...lineItems, {
      description: `Catering Package - ${defaultPackage.name}`,
      quantity: guestCount,
      unit_price: price,
      line_total: guestCount * price
    }]);
  };

  const handleAddCustomMenu = (newLineItem: any) => {
    setLineItems([...lineItems, newLineItem]);
  };

  const handleAddCustomItem = () => {
    setLineItems([...lineItems, {
      description: 'Custom Charge',
      quantity: 1,
      unit_price: 0,
      line_total: 0
    }]);
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const qty = Number(updated[index].quantity) || 0;
      const price = Number(updated[index].unit_price) || 0;
      updated[index].line_total = qty * price;
    }
    
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...lineItems];
    updated.splice(index, 1);
    setLineItems(updated);
  };

  const handleSubmit = async (status: string) => {
    if (lineItems.length === 0) return alert("Add at least one line item.");
    
    setIsSubmitting(true);
    try {
      let quotationId = existingQuotation?.id;

      if (!quotationId) {
        // Create new quotation
        const { data: newQuote, error: quoteErr } = await supabase
          .from('quotations')
          .insert([{
            business_id: businessId,
            booking_id: booking?.id,
            customer_id: booking?.customer_id,
            total_amount: grandTotal,
            notes,
            valid_until: new Date(validUntil).toISOString(),
            status
          }])
          .select()
          .single();
          
        if (quoteErr) throw quoteErr;
        quotationId = newQuote.id;
      } else {
        // Update existing quotation
        const { error: quoteErr } = await supabase
          .from('quotations')
          .update({
            total_amount: grandTotal,
            notes,
            valid_until: new Date(validUntil).toISOString(),
            status
          })
          .eq('id', quotationId);
          
        if (quoteErr) throw quoteErr;

        // Clear old line items to replace them
        await supabase.from('quotation_line_items').delete().eq('quotation_id', quotationId);
      }

      // Insert fresh line items
      const itemsToInsert = lineItems.map(item => ({
        quotation_id: quotationId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));

      const { error: itemsErr } = await supabase.from('quotation_line_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      router.refresh();
      router.push('/dashboard/quotations');
    } catch (error) {
      console.error(error);
      alert('Failed to save quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
        
        {/* Valid Until Date Picker */}
        <div className="max-w-xs">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Valid Until</label>
          <input 
            type="date" 
            value={validUntil} 
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864]/20"
          />
        </div>

        {/* Line Items Builder */}
        <div>
          <h3 className="text-xs font-bold text-[#1F3864] uppercase tracking-widest mb-4">Financial Breakdown</h3>
          
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-12 gap-4 px-2 pb-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:grid">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Unit Price (PKR)</div>
              <div className="col-span-2 text-right">Line Total</div>
            </div>
            
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="sm:col-span-6">
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={e => handleUpdateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800"
                    placeholder="Item Description"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={e => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-center"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input 
                    type="number" 
                    value={item.unit_price} 
                    onChange={e => handleUpdateItem(index, 'unit_price', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-bold text-gray-900 text-sm">
                    PKR {Number(item.line_total).toLocaleString()}
                  </span>
                  <button onClick={() => handleRemoveItem(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleAddVenueCharge} className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5">
              <Plus className="w-3 h-3" /> Add Venue Charge
            </button>
            <button onClick={handleAddPackage} className="px-4 py-2 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1.5">
              <Plus className="w-3 h-3" /> Add Fixed Package
            </button>
            <button onClick={() => setIsCustomMenuOpen(true)} className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5">
              <UtensilsCrossed className="w-3 h-3" /> Add Custom Menu
            </button>
            <button onClick={handleAddCustomItem} className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
              <Plus className="w-3 h-3" /> Custom Item
            </button>
          </div>
        </div>

        {/* Terms & Grand Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Terms & Notes</label>
            <textarea 
              rows={4}
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 resize-none"
            />
          </div>
          <div className="flex flex-col justify-end items-end">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 w-full sm:w-80">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Grand Total</p>
              <p className="text-3xl font-black text-[#1F3864] font-serif">PKR {grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Final Actions */}
        <div className="flex justify-end gap-3 pt-6">
          <button 
            onClick={() => handleSubmit('Draft')} 
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button 
            onClick={() => handleSubmit('Sent')} 
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Mark as Sent
          </button>
        </div>
      </div>

      <CustomMenuSelector 
        isOpen={isCustomMenuOpen}
        onClose={() => setIsCustomMenuOpen(false)}
        onAdd={handleAddCustomMenu}
        businessId={businessId}
        defaultGuestCount={guestCount}
      />
    </>
  );
}