'use client';

import { useState, useEffect } from 'react';
import { X, Truck, Calendar } from 'lucide-react';
import { InventoryItem, recordStockPurchase } from '@/lib/inventory';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  items: InventoryItem[];
  preselectedItemId?: string;
}

export default function AddStockModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  items,
  preselectedItemId,
}: AddStockModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      const targetId = preselectedItemId || items[0].id;
      setSelectedItemId(targetId);
      const matched = items.find((i) => i.id === targetId);
      if (matched) {
        setCostPrice(matched.cost_price);
      }
    }
  }, [isOpen, items, preselectedItemId]);

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const matched = items.find((i) => i.id === itemId);
    if (matched) {
      setCostPrice(matched.cost_price);
    }
  };

  if (!isOpen) return null;

  const totalPurchaseValue = Number(quantity || 0) * Number(costPrice || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Please select an item.');
      return;
    }
    if (quantity <= 0) {
      alert('Quantity purchased must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordStockPurchase(
        businessId,
        selectedItemId,
        quantity,
        costPrice,
        notes
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording stock purchase:', err);
      alert(`Failed to log stock purchase: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-gray-900">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-serif font-bold text-[#1F3864] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#B8860B]" /> Add Stock (Purchase Ledger)
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Select Item *
            </label>
            <select
              required
              value={selectedItemId}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.current_stock} {item.unit}s in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Quantity Purchased *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Cost Price / Unit (PKR)
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
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Supplier / Purchase Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Purchased from Gourmet Distributors, Invoice #8841"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
            />
          </div>

          {/* Total Calculation Display Card */}
          <div className="bg-[#1F3864]/5 p-4 rounded-xl border border-[#1F3864]/10 flex justify-between items-center">
            <span className="text-xs font-bold text-[#1F3864] uppercase tracking-wider">
              Total Purchase Value
            </span>
            <span className="text-xl font-black text-[#1F3864]">
              PKR {totalPurchaseValue.toLocaleString()}
            </span>
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
              className="px-5 py-2 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Logging Stock...' : 'Confirm Stock Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}