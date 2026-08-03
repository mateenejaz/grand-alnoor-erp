'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, PackageCheck } from 'lucide-react';
import { InventoryItem, ContractConsumable } from '@/types/inventory';

interface ContractConsumablesProps {
  contractId: string;
  businessId: string;
}

export default function ContractConsumablesSection({ contractId, businessId }: ContractConsumablesProps) {
  const [contractConsumables, setContractConsumables] = useState<ContractConsumable[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add consumable form
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch items attached to this contract's final bill
      const billRes = await fetch(`/api/contracts/${contractId}/consumables`);
      const billData = await billRes.json();
      if (billRes.ok) {
        setContractConsumables(billData.data || []);
      }

      // 2. Fetch available inventory items
      const invRes = await fetch(`/api/inventory?business_id=${businessId}`);
      const invData = await invRes.json();
      if (invRes.ok) {
        setAvailableItems(invData.items || []);
      }
    } catch (err) {
      console.error('Failed to load contract consumables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId && businessId) {
      fetchData();
    }
  }, [contractId, businessId]);

  const handleSelectItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const selected = availableItems.find((i) => i.id === itemId);
    if (selected) {
      setUnitPrice(Number(selected.default_selling_price_pkr));
    }
  };

  const handleAddConsumableToBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/contracts/${contractId}/consumables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: selectedItemId,
          quantity_consumed: quantity,
          unit_price_pkr: unitPrice,
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setSelectedItemId('');
        setQuantity(1);
        setUnitPrice(0);
        fetchData(); // Refreshes and updates remaining stock counts
      } else {
        alert(`Stock Error: ${responseData.error}`);
      }
    } catch (err) {
      alert('Failed to add consumable to final bill');
    } finally {
      setSubmitting(false);
    }
  };

  const totalConsumablesCost = contractConsumables.reduce(
    (sum, c) => sum + Number(c.total_price_pkr),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" /> Event Consumables (Final Bill Only)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cold drinks & mineral water added here are billed to the customer and deducted automatically from central stock.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500">Consumables Total</span>
          <p className="text-lg font-bold text-emerald-600">Rs. {totalConsumablesCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddConsumableToBill} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Add Item to Final Bill</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <select
              value={selectedItemId}
              onChange={(e) => handleSelectItemChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Choose Consumable Item --</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.current_stock} {item.unit_of_measure})
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <input
              type="number"
              min="0"
              placeholder="Unit Price PKR"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add to Bill & Deduct Stock
          </button>
        </div>
      </form>

      {/* Added Consumables Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium text-right">Quantity</th>
              <th className="p-3 font-medium text-right">Unit Price (PKR)</th>
              <th className="p-3 font-medium text-right">Subtotal (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contractConsumables.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500 text-xs">
                  No extra consumables added to this contract final bill.
                </td>
              </tr>
            ) : (
              contractConsumables.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-medium text-gray-900">{c.inventory_items?.name || 'Consumable Item'}</td>
                  <td className="p-3 text-right">
                    {c.quantity_consumed} {c.inventory_items?.unit_of_measure}
                  </td>
                  <td className="p-3 text-right">Rs. {Number(c.unit_price_pkr).toLocaleString()}</td>
                  <td className="p-3 text-right font-semibold text-emerald-700">
                    Rs. {Number(c.total_price_pkr).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}