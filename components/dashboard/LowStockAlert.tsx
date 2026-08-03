'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { getLowStockItems, InventoryItem } from '@/lib/inventory';

interface LowStockAlertProps {
  businessId: string;
}

export default function LowStockAlert({ businessId }: LowStockAlertProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const lowStockData = await getLowStockItems(businessId);
        setItems(lowStockData);
      } catch (error) {
        console.error('Failed to load low stock items for dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      loadAlerts();
    }
  }, [businessId]);

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900 font-serif">Low Stock Alert</h3>
            <p className="text-xs text-amber-700 font-medium">
              {items.length} {items.length === 1 ? 'item requires' : 'items require'} immediate restocking
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/inventory"
          className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200/80 px-3 py-1.5 rounded-xl transition-all"
        >
          Manage Inventory <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List of Items */}
      <div className="divide-y divide-amber-200/50">
        {items.map((item) => {
          const isOut = item.current_stock <= 0;
          return (
            <Link
              key={item.id}
              href="/dashboard/inventory"
              className="py-3 flex items-center justify-between hover:bg-amber-100/50 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-amber-600 group-hover:text-amber-800 transition-colors" />
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-amber-950">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-amber-800/80 font-medium capitalize">
                    Category: {item.category ? item.category.replace('_', ' ') : 'General'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      isOut ? 'bg-red-100 text-red-700' : 'bg-amber-200/80 text-amber-900'
                    }`}
                  >
                    Current Stock: {item.current_stock} {item.unit}
                  </span>
                  <p className="text-[10px] text-amber-800/80 font-semibold mt-0.5">
                    Reorder Level: {item.reorder_level} {item.unit}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-amber-700 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}