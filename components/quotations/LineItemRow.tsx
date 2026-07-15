'use client';

import { X } from 'lucide-react';

interface LineItemRowProps {
  index: number;
  item: { description: string; quantity: number | string; unit_price: number | string };
  onChange: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
}

export default function LineItemRow({ index, item, onChange, onRemove }: LineItemRowProps) {
  // Real-time calculation constraint
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unit_price) || 0;
  const lineTotal = qty * price;

  return (
    <div className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
      <div className="col-span-12 md:col-span-5">
        <input 
          type="text" 
          placeholder="Item description..." 
          value={item.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <input 
          type="number" 
          placeholder="Qty" 
          value={item.quantity}
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <input 
          type="number" 
          placeholder="Unit Price" 
          value={item.unit_price}
          onChange={(e) => onChange(index, 'unit_price', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
        />
      </div>
      <div className="col-span-4 md:col-span-2 text-right px-3">
        <span className="text-sm font-bold text-gray-900">
          PKR {lineTotal.toLocaleString()}
        </span>
      </div>
      <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
        <button 
          type="button" 
          onClick={() => onRemove(index)}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove Item"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}