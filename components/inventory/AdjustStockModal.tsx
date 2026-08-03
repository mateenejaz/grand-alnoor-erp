'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { InventoryItem, adjustStockQuantity } from '@/lib/inventory';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  item: InventoryItem | null;
}

export default function AdjustStockModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  item,
}: AdjustStockModalProps) {
  const [newStock, setNewStock] = useState<number>(item?.current_stock || 0);
  const [reason, setReason] = useState<string>('Inventory count correction');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const currentStock = item.current_stock;
  const difference = Number(newStock) - currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock < 0) {
      alert('Stock cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustStockQuantity(
        businessId,
        item.id,
        newStock,
        reason || 'Manual stock correction'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      alert(`Error adjusting stock: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-gray-900">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-serif font-bold text-[#1F3864] flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#B8860B]" /> Correct Stock Level
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-900 font-medium">
            Item: <strong className="font-bold text-[#1F3864]">{item.name}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Current Recorded Stock
              </label>
              <div className="px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl font-black text-gray-700 text-base">
                {currentStock} {item.unit}s
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                New Correct Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base font-black text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
              />
            </div>
          </div>

          {/* Impact Indicator */}
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            difference === 0 
              ? 'bg-gray-100 text-gray-600' 
              : difference > 0 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {difference === 0 
                ? 'No stock change' 
                : difference > 0 
                ? `Adding +${difference} ${item.unit}(s) to inventory` 
                : `Removing ${Math.abs(difference)} ${item.unit}(s) from inventory`}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Reason / Explanation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Over-counted during previous entry, Damaged bottles..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
            />
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
              {isSubmitting ? 'Updating...' : 'Confirm Stock Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}