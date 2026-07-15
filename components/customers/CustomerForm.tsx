'use client';

import { useState } from 'react';
import { X, User, Phone, Loader2 } from 'lucide-react';
import { createCustomer, updateCustomer } from '@/lib/customers';
import { useRouter } from 'next/navigation';

interface CustomerFormProps {
  businessId: string;
  initialData?: any;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function CustomerForm({ businessId, initialData, onClose, onSuccess }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    cnic: initialData?.cnic || '',
    address: initialData?.address || '',
    referral_source: initialData?.referral_source || 'Walk-in',
    notes: initialData?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
    else router.back(); // If opened via URL edit parameter
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      setError("Full Name and Phone Number are required.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateCustomer(initialData.id, formData);
      } else {
        await createCustomer({ ...formData, business_id: businessId });
      }

      if (onSuccess) onSuccess();
      else {
        router.refresh();
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to save customer data. Ensure phone number is unique.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative">
      <div className="bg-[#1F3864] px-6 py-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg"><User className="w-5 h-5" /></div>
          <div>
            <h2 className="font-serif font-bold text-lg leading-tight">{isEditing ? 'Edit Client Profile' : 'Register New Client'}</h2>
          </div>
        </div>
        <button type="button" onClick={handleClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[80vh] bg-gray-50/50">
        <form id="customer-form" onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Full Name *</label>
              <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" placeholder="e.g. Ali Khan" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Phone Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="w-4 h-4 text-gray-400" /></div>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" placeholder="e.g. 0300 1234567" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">CNIC (Optional)</label>
                <input type="text" value={formData.cnic} onChange={e => setFormData({...formData, cnic: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" placeholder="XXXXX-XXXXXXX-X" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Acquisition Source</label>
                <select value={formData.referral_source} onChange={e => setFormData({...formData, referral_source: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]">
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone enquiry">Phone enquiry</option>
                  <option value="Referral">Referral</option>
                  <option value="Social media">Social media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Home / Office Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" placeholder="Full street address..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Background Notes</label>
              <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] resize-none" placeholder="Important details about this client..." />
            </div>
          </div>
        </form>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
        <button type="button" onClick={handleClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
        <button type="submit" form="customer-form" disabled={isSubmitting} className="px-8 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEditing ? 'Update Client' : 'Save Client'}
        </button>
      </div>
    </div>
  );
}