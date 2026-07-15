'use client';

import { useState } from 'react';
import { X, UtensilsCrossed, Loader2 } from 'lucide-react';
import { createMenuItem, updateMenuItem } from '@/lib/menu';
import { useRouter } from 'next/navigation';

interface MenuItemFormProps {
  businessId: string;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MenuItemForm({ businessId, initialData, onClose, onSuccess }: MenuItemFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Starter',
    // FIXED: Safely fallback to true if initialData or is_active is null/undefined
    is_active: initialData?.is_active ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Item name is required.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updateMenuItem(initialData.id, formData);
      } else {
        await createMenuItem({ ...formData, business_id: businessId });
      }
      onSuccess();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save menu item.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative">
      <div className="bg-[#1F3864] px-6 py-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg"><UtensilsCrossed className="w-5 h-5" /></div>
          <h2 className="font-serif font-bold text-lg leading-tight">{isEditing ? 'Edit Menu Item' : 'New Menu Item'}</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-6 overflow-y-auto bg-gray-50/50">
        <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Item Name *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" placeholder="e.g. Chicken Karahi" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]">
              <option value="Starter">Starter / Appetizer</option>
              <option value="Main">Main Course</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
            <input 
              type="checkbox" 
              id="active-toggle"
              checked={formData.is_active} 
              onChange={e => setFormData({...formData, is_active: e.target.checked})} 
              className="w-5 h-5 text-[#1F3864] rounded border-gray-300 focus:ring-[#1F3864]"
            />
            <label htmlFor="active-toggle" className="text-sm font-bold text-gray-900 cursor-pointer">
              Item is Active
              <span className="block text-xs font-normal text-gray-500 mt-0.5">Available for selection in packages</span>
            </label>
          </div>
        </form>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
        <button type="submit" form="item-form" disabled={isSubmitting} className="px-8 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Item'}
        </button>
      </div>
    </div>
  );
}