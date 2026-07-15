'use client';

import { useState } from 'react';
import { X, Package, Loader2, Check } from 'lucide-react';
import { createPackage, updatePackage, syncPackageItems } from '@/lib/menu';
import { useRouter } from 'next/navigation';

interface PackageFormProps {
  businessId: string;
  allItems: any[];
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PackageForm({ businessId, allItems, initialData, onClose, onSuccess }: PackageFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price_per_head: initialData?.price_per_head || '',
    description: initialData?.description || '',
    // FIXED: Safely fallback to true if initialData or is_active is null/undefined
    is_active: initialData?.is_active ?? true
  });

  // Extract initial item IDs if editing
  const existingItemIds = initialData?.package_items?.map((pi: any) => pi.item_id) || [];
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(existingItemIds);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price_per_head) {
      setError("Package name and Price per head are required.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let packageId = initialData?.id;

      if (isEditing) {
        await updatePackage(packageId, formData);
      } else {
        const newPkg = await createPackage({ ...formData, business_id: businessId });
        packageId = newPkg.id;
      }

      // Sync the checklist items to the database
      await syncPackageItems(packageId, selectedItemIds);

      onSuccess();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save package.");
      setIsSubmitting(false);
    }
  };

  const categories = ['Starter', 'Main', 'Dessert', 'Beverage'];
  const activeItems = allItems.filter(i => i.is_active);

  return (
    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 relative">
      <div className="bg-[#B8860B] px-6 py-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg"><Package className="w-5 h-5" /></div>
          <h2 className="font-serif font-bold text-lg leading-tight">{isEditing ? 'Edit Package' : 'New Menu Package'}</h2>
        </div>
        <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
        <form id="package-form" onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Package Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B]" placeholder="e.g. Standard Walima" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Price Per Head (PKR) *</label>
              <input type="number" value={formData.price_per_head} onChange={e => setFormData({...formData, price_per_head: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B]" placeholder="e.g. 2500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Package Description</label>
              <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] resize-none" placeholder="Brief summary of what this tier offers..." />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200">
              <input type="checkbox" id="pkg-active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 text-[#B8860B] rounded border-gray-300 focus:ring-[#B8860B]" />
              <label htmlFor="pkg-active" className="text-sm font-bold text-gray-900 cursor-pointer">Package is Active</label>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Select Included Menu Items</h3>
            {activeItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No active menu items available. Add dishes first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {categories.map(category => {
                  const catItems = activeItems.filter(i => i.category === category);
                  if (catItems.length === 0) return null;
                  
                  return (
                    <div key={category} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{category}</h4>
                      <div className="space-y-2">
                        {catItems.map(item => {
                          const isSelected = selectedItemIds.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleItem(item.id)}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all border ${isSelected ? 'bg-[#B8860B]/10 border-[#B8860B]/30 text-[#B8860B] font-bold' : 'bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100'}`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${isSelected ? 'bg-[#B8860B] border-[#B8860B] text-white' : 'bg-white border-gray-300'}`}>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="truncate">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
        <button type="submit" form="package-form" disabled={isSubmitting} className="px-8 py-2.5 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Package'}
        </button>
      </div>
    </div>
  );
}