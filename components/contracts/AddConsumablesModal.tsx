'use client';

import { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { InventoryItem, getInventoryItems } from '@/lib/inventory';
import { addConsumableCharge } from '@/lib/contracts';

interface AddConsumablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  contractId: string;
}

export default function AddConsumablesModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  contractId,
}: AddConsumablesModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadItems() {
      if (!isOpen || !businessId) return;
      setLoading(true);
      try {
        const activeItems = await getInventoryItems(businessId);
        setItems(activeItems);
        // Initialize 0 quantities
        const initialQty: Record<string, number> = {};
        activeItems.forEach((item) => {
          initialQty[item.id] = 0;
        });
        setQuantities(initialQty);
      } catch (err) {
        console.error('Failed to load items for contract charges:', err);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  // Calculate Running Total
  const totalToAdd = items.reduce((sum, item) => {
    const qty = quantities[item.id] || 0;
    return sum + qty * item.selling_price;
  }, 0);

  // Check if any item quantity exceeds current stock
  const hasStockWarning = items.some((item) => {
    const qty = quantities[item.id] || 0;
    return qty > item.current_stock;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedItems = items.filter((item) => (quantities[item.id] || 0) > 0);

    if (selectedItems.length === 0) {
      alert('Please enter a quantity greater than zero for at least one item.');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const item of selectedItems) {
        const qty = quantities[item.id];
        await addConsumableCharge(businessId, contractId, item.id, qty);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add consumable charges:', err);
      alert(`Error saving charges: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 text-gray-900">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-serif font-bold text-[#1F3864] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#B8860B]" /> Add Consumables to Final Bill
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading active inventory items...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {items.map((item) => {
                const qty = quantities[item.id] || 0;
                const isExceeding = qty > item.current_stock;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isExceeding
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        PKR {item.selling_price.toLocaleString()} / {item.unit} | Stock:{' '}
                        <span className={`font-bold ${item.current_stock <= 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.current_stock} {item.unit}s
                        </span>
                      </p>
                    </div>

                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-center text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning if requested > stock */}
            {hasStockWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>One or more items exceed current recorded stock. System will allow entry and record negative balance.</span>
              </div>
            )}

            {/* Running Total Card */}
            <div className="bg-[#1F3864]/5 p-4 rounded-xl border border-[#1F3864]/10 flex justify-between items-center">
              <span className="text-xs font-bold text-[#1F3864] uppercase tracking-wider">
                Total to Add to Bill
              </span>
              <span className="text-xl font-black text-[#1F3864]">
                PKR {totalToAdd.toLocaleString()}
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
                disabled={isSubmitting || totalToAdd === 0}
                className="px-5 py-2 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Adding Charges...' : 'Add Charges & Deduct Stock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}