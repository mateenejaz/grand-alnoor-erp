'use client';

import { useState, useEffect } from 'react';
import { X, UtensilsCrossed, Loader2, CheckSquare, Square } from 'lucide-react';
import { supabaseBrowser as supabase } from '@/lib/supabase-client';

interface CustomMenuSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lineItem: any) => void;
  businessId: string;
  defaultGuestCount: number;
}

export default function CustomMenuSelector({ isOpen, onClose, onAdd, businessId, defaultGuestCount }: CustomMenuSelectorProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  const [guestCount, setGuestCount] = useState<number>(defaultGuestCount || 0);
  const [pricePerHead, setPricePerHead] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchMenuData() {
      setIsLoading(true);
      try {
        // Fetch categories (Removed strict status spelling check)
        const { data: catData } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
          
        // Fetch items (Removed strict status spelling check)
        const { data: itemData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', businessId);

        // Filter out explicitly 'inactive' items, keeping everything else safely
        const activeCategories = (catData || []).filter(c => c.status?.toLowerCase() !== 'inactive');
        const activeItems = (itemData || []).filter(i => i.status?.toLowerCase() !== 'inactive');

        setCategories(activeCategories);
        setItems(activeItems);
      } catch (error) {
        console.error("Failed to load menu data", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenuData();
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  const lineTotal = guestCount * pricePerHead;

  const handleAddMenu = () => {
    if (guestCount <= 0 || pricePerHead <= 0) {
      alert("Please enter a valid guest count and price per head.");
      return;
    }

    if (selectedItemIds.size === 0) {
      const confirmEmpty = window.confirm("You haven't selected any dishes. Do you still want to add this custom menu?");
      if (!confirmEmpty) return;
    }

    // Get names of selected items for the description
    const selectedNames = items
      .filter(item => selectedItemIds.has(item.id))
      .map(item => item.name)
      .join(', ');

    const itemDescription = selectedNames 
      ? `Custom Menu Selection (${selectedNames})`
      : 'Custom Menu Selection';

    const newLineItem = {
      description: itemDescription,
      quantity: guestCount,
      unit_price: pricePerHead,
      line_total: lineTotal
    };

    onAdd(newLineItem);
    
    // Reset and close
    setSelectedItemIds(new Set());
    setPricePerHead(0);
    onClose();
  };

  // Find items that don't belong to any valid category
  const uncategorizedItems = items.filter(item => !item.category_id || !categories.find(c => c.id === item.category_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="bg-[#1F3864] px-6 py-4 flex justify-between items-center text-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><UtensilsCrossed className="w-5 h-5" /></div>
            <h2 className="font-serif font-bold text-lg">Build Custom Menu</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1 flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Menu Item Selection */}
          <div className="flex-1 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">Select Dishes</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-[#1F3864]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-gray-500 text-sm">No active menu items found. Please add them in the Menu settings.</p>
            ) : (
              <div className="space-y-6">
                
                {/* Categorized Items */}
                {categories.map(category => {
                  const categoryItems = items.filter(item => item.category_id === category.id);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-3 text-sm">{category.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoryItems.map(item => {
                          const isSelected = selectedItemIds.has(item.id);
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => toggleItem(item.id)}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100'}`}
                            >
                              <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{item.name}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized Items Safety Net */}
                {uncategorizedItems.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Other Dishes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {uncategorizedItems.map(item => {
                        const isSelected = selectedItemIds.has(item.id);
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-100'}`}
                          >
                            <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{item.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right Column: Pricing & Math */}
          <div className="w-full md:w-72 space-y-5 shrink-0">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-0">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">Pricing Calculation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Guest Count *</label>
                  <input 
                    type="number" 
                    value={guestCount} 
                    onChange={e => setGuestCount(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" 
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom Price Per Head (PKR) *</label>
                  <input 
                    type="number" 
                    value={pricePerHead || ''} 
                    onChange={e => setPricePerHead(Number(e.target.value))} 
                    placeholder="e.g. 1800"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]" 
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Menu Cost</p>
                <p className="text-2xl font-black text-[#1F3864]">PKR {lineTotal.toLocaleString()}</p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs font-semibold rounded-lg">
                {selectedItemIds.size} dish{selectedItemIds.size === 1 ? '' : 'es'} selected
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleAddMenu} className="px-8 py-2.5 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-md transition-all">
            Add to Quotation
          </button>
        </div>
      </div>
    </div>
  );
}