'use client';

import { useState } from 'react';
import { Plus, Edit, EyeOff, Eye, Utensils } from 'lucide-react';
import MenuItemForm from './MenuItemForm';
import { updateMenuItem } from '@/lib/menu';
import { useRouter } from 'next/navigation';

interface MenuItemListProps {
  businessId: string;
  items: any[];
}

export default function MenuItemList({ businessId, items }: MenuItemListProps) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['Starter', 'Main', 'Dessert', 'Beverage'];

  const toggleStatus = async (item: any) => {
    try {
      await updateMenuItem(item.id, { is_active: !item.is_active });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900 font-serif text-lg">Individual Dishes</h3>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Dish
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map(category => {
          const categoryItems = items.filter(i => i.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">{category}</h4>
              <div className="space-y-2">
                {categoryItems.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${item.is_active ? 'bg-white border-gray-200 hover:border-[#1F3864]/30' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div>
                      <p className={`font-semibold text-sm ${item.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{item.name}</p>
                      {!item.is_active && <p className="text-[10px] font-bold text-red-500 uppercase mt-0.5">Inactive</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleStatus(item)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title={item.is_active ? "Deactivate" : "Activate"}>
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingItem(item)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-500">
            No dishes added yet. Create menu items to build packages.
          </div>
        )}
      </div>

      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <MenuItemForm 
            businessId={businessId} 
            initialData={editingItem} 
            onClose={() => { setShowAddModal(false); setEditingItem(null); }} 
            onSuccess={() => { setShowAddModal(false); setEditingItem(null); }} 
          />
        </div>
      )}
    </div>
  );
}