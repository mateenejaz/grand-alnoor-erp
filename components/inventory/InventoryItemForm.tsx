'use client';

import { useState } from 'react';
import { X, PackagePlus, Edit3 } from 'lucide-react';
import { InventoryItem, createInventoryItem, updateInventoryItem } from '@/lib/inventory';

interface InventoryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  itemToEdit?: InventoryItem | null;
}

export default function InventoryItemForm({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  itemToEdit,
}: InventoryItemFormProps) {
  const [name, setName] = useState(itemToEdit?.name || '');
  const [category, setCategory] = useState<'cold_drink' | 'mineral_water' | 'other'>(
    itemToEdit?.category || 'cold_drink'
  );
  const [unit, setUnit] = useState(itemToEdit?.unit || 'bottle');
  const [costPrice, setCostPrice] = useState<number>(itemToEdit?.cost_price || 0);
  const [sellingPrice, setSellingPrice] = useState<number>(itemToEdit?.selling_price || 0);
  const [reorderLevel, setReorderLevel] = useState<number>(itemToEdit?.reorder_level || 10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an item name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (itemToEdit) {
        await updateInventoryItem(itemToEdit.id, {
          name,
          category,
          unit,
          cost_price: costPrice,
          selling_price: sellingPrice,
          reorder_level: reorderLevel,
        });
      } else {
        await createInventoryItem({
          business_id: businessId,
          name,
          category,
          unit,
          cost_price: costPrice,
          selling_price: sellingPrice,
          current_stock: 0,
          reorder_level: reorderLevel,
          is_active: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving item:', err);
      alert(`Failed to save item: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-gray-900">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-serif font-bold text-[#1F3864] flex items-center gap-2">
            {itemToEdit ? <Edit3 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            {itemToEdit ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Coca Cola 1.5L, Nestlé Water 500ml"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              >
                <option value="cold_drink">Cold Drink</option>
                <option value="mineral_water">Mineral Water</option>
                <option value="other">Other (Ice/Disposables)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Unit Type
              </label>
              <input
                type="text"
                required
                placeholder="e.g. bottle, can, crate"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Cost Price (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Selling Price (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Reorder Threshold (Low Stock Limit)
            </label>
            <input
              type="number"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Triggers a red "Low Stock" warning badge when quantity reaches this number.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}