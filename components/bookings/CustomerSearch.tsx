'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2 } from 'lucide-react';
import { searchCustomers } from '@/lib/customers';

interface CustomerSearchProps {
  businessId: string;
  onCustomerReady: (customerData: any) => void;
}

export default function CustomerSearch({ businessId, onCustomerReady }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Selection states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', cnic: '', address: '' });

  // Debounced search
  useEffect(() => {
    if (query.length > 1 && !selectedCustomer && !isCreatingNew) {
      setIsSearching(true);
      const fetcher = setTimeout(async () => {
        try {
          const res = await searchCustomers(businessId, query);
          setResults(res);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        }
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(fetcher);
    } else {
      setShowDropdown(false);
    }
  }, [query, businessId, selectedCustomer, isCreatingNew]);

  const handleSelectExisting = (customer: any) => {
    setSelectedCustomer(customer);
    setQuery(customer.full_name + ' - ' + customer.phone);
    setShowDropdown(false);
    onCustomerReady({ id: customer.id });
  };

  const handleConfirmNewCustomer = () => {
    if (!newCustomer.full_name || !newCustomer.phone) return;
    onCustomerReady({ newCustomerData: newCustomer });
    setIsCreatingNew(false);
    setSelectedCustomer({ full_name: newCustomer.full_name, phone: newCustomer.phone, isNew: true });
  };

  return (
    <div className="relative w-full space-y-2">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Customer / Client</label>
      
      {!selectedCustomer && !isCreatingNew ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] transition-all"
            placeholder="Search by name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-1">
                  {results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectExisting(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 rounded-lg transition-colors flex flex-col"
                    >
                      <span className="font-semibold text-gray-900">{c.full_name}</span>
                      <span className="text-xs text-gray-500">{c.phone}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No existing customers found.</div>
              )}
              
              <div className="border-t border-gray-100 p-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowDropdown(false); setIsCreatingNew(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#152644] transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add New Customer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : selectedCustomer ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-900">{selectedCustomer.full_name}</p>
              <p className="text-xs text-green-700">{selectedCustomer.phone} {selectedCustomer.isNew && '(New Profile)'}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => { setSelectedCustomer(null); setQuery(''); onCustomerReady(null); }}
            className="text-xs font-semibold text-green-700 hover:text-green-900 underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex justify-between items-center">
            Register New Customer
            <button type="button" onClick={() => setIsCreatingNew(false)} className="text-xs text-gray-500 hover:text-gray-900 underline">Cancel</button>
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Full Name *" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newCustomer.full_name} onChange={e => setNewCustomer({...newCustomer, full_name: e.target.value})} />
            <input type="text" placeholder="Phone Number *" className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
            <input type="text" placeholder="CNIC (Optional)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newCustomer.cnic} onChange={e => setNewCustomer({...newCustomer, cnic: e.target.value})} />
            <input type="text" placeholder="Address (Optional)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
          </div>
          <button 
            type="button" 
            onClick={handleConfirmNewCustomer}
            disabled={!newCustomer.full_name || !newCustomer.phone}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            Attach to Booking
          </button>
        </div>
      )}
    </div>
  );
}