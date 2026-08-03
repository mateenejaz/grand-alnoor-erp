'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Truck,
  Edit3,
  Trash2,
  History,
  CheckCircle2,
  X,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  InventoryItem,
  InventoryTransaction,
  getInventoryItems,
  deactivateInventoryItem,
  getStockHistory,
} from '@/lib/inventory';
import InventoryItemForm from './InventoryItemForm';
import AddStockModal from './AddStockModal';
import AdjustStockModal from './AdjustStockModal';

interface InventoryListProps {
  businessId: string;
}

export default function InventoryList({ businessId }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [selectedItemForStock, setSelectedItemForStock] = useState<string | undefined>();

  // Stock History Drawer/Modal
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<InventoryTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInventoryItems(businessId);
      setItems(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) loadData();
  }, [businessId]);

  const handleDeactivate = async (item: InventoryItem) => {
    const confirm = window.confirm(
      `Are you sure you want to deactivate "${item.name}"? It will no longer appear in catering options.`
    );
    if (!confirm) return;

    try {
      await deactivateInventoryItem(item.id);
      loadData();
    } catch (err) {
      alert('Failed to deactivate item.');
    }
  };

  const handleOpenHistory = async (item: InventoryItem) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const logs = await getStockHistory(item.id);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Summary Metrics
  const totalItemsCount = items.length;
  const lowStockCount = items.filter((i) => i.isLowStock).length;
  const totalStockValue = items.reduce(
    (sum, i) => sum + i.current_stock * i.cost_price,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
            <Package className="w-7 h-7 text-[#1F3864]" /> Consumables Inventory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Shared stock inventory across RSM Hall & JTS Hall
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedItemForStock(undefined);
              setIsStockModalOpen(true);
            }}
            disabled={items.length === 0}
            className="px-4 py-2.5 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Truck className="w-4 h-4" /> Add Stock
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Active Items</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalItemsCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-[#1F3864] rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Low Stock Alert</p>
            <p className={`text-3xl font-black mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Stock Valuation</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              PKR {totalStockValue.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-[#B8860B] rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm font-medium">Loading inventory records...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-base text-gray-700">No inventory items found</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add New Item" above to create cold drinks or mineral water entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Unit</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-gray-900">{item.name}</td>
                    <td className="py-4 px-4 text-xs font-semibold text-gray-600 capitalize">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-gray-500 font-medium">{item.unit}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-black text-gray-900 text-base">{item.current_stock}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-600">
                      PKR {item.cost_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">
                      PKR {item.selling_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right space-x-1">
                      {/* Correct Stock Action */}
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setIsAdjustModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold text-[#B8860B] hover:bg-amber-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Edit / Correct Stock Quantity"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Correct Stock
                      </button>

                      {/* View History Action */}
                      <button
                        onClick={() => handleOpenHistory(item)}
                        className="px-2.5 py-1.5 text-xs font-bold text-[#1F3864] hover:bg-[#1F3864]/5 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="View Purchase Ledger & History"
                      >
                        <History className="w-3.5 h-3.5" /> History
                      </button>

                      {/* Edit Item Details Action */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#1F3864] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Item Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Deactivate Item Action */}
                      <button
                        onClick={() => handleDeactivate(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock History Drawer / Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 text-gray-900">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1F3864]">
                  Stock History: {historyItem.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Current Balance: <strong className="text-gray-900">{historyItem.current_stock} {historyItem.unit}s</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <p className="text-center py-8 text-xs text-gray-400">Loading ledger logs...</p>
              ) : historyLogs.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-400">No transaction logs recorded yet.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Stock Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 text-gray-600">
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.transaction_type === 'purchase'
                                ? 'bg-green-100 text-green-800'
                                : log.transaction_type === 'adjustment'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {log.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {log.transaction_type === 'purchase' || log.transaction_type === 'adjustment' ? `+${log.quantity}` : `-${log.quantity}`}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-600">
                          PKR {log.unit_price.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          PKR {log.total_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-[#1F3864]">
                          {log.running_balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 text-right">
              <button
                onClick={() => setHistoryItem(null)}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      <InventoryItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        businessId={businessId}
        itemToEdit={editingItem}
      />

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={loadData}
        businessId={businessId}
        items={items}
        preselectedItemId={selectedItemForStock}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={loadData}
        businessId={businessId}
        item={adjustingItem}
      />
    </div>
  );
}