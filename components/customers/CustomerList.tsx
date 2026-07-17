'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Phone, User, Calendar, ArrowRight, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCustomers } from '@/lib/customers';
import CustomerForm from './CustomerForm';
import { format } from 'date-fns';
import { supabaseBrowser } from '@/lib/supabase-client';

interface CustomerListProps {
  initialCustomers: any[];
  businessId: string;
}

export default function CustomerList({ initialCustomers, businessId }: CustomerListProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Track profile deletion selection targets
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live search debouncer
  useEffect(() => {
    if (!query) {
      setCustomers(initialCustomers);
      return;
    }

    setIsSearching(true);
    const fetcher = setTimeout(async () => {
      try {
        const results = await getCustomers(businessId, query);
        setCustomers(results);
      } catch (err) {
        console.error(err);
      }
      setIsSearching(false);
    }, 300); // Wait 300ms after user stops typing to fetch

    return () => clearTimeout(fetcher);
  }, [query, businessId, initialCustomers]);

  const handleSuccess = () => {
    setShowAddModal(false);
    router.refresh();
  };

  const handleDeleteCustomer = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stops row from opening detail file links
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabaseBrowser
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      setCustomerToDelete(null);
      router.refresh(); // Syncs the view index context state
    } catch (err) {
      console.error("Deletion failure error:", err);
      alert("Could not remove this customer file. They are likely tied to an existing booking, quote, or contract.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] relative">
      
      {/* Top Toolbar */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] transition-all shadow-sm"
            placeholder="Fast Search by name or phone number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><div className="w-4 h-4 border-2 border-[#1F3864] border-t-transparent rounded-full animate-spin" /></div>}
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" /> Register Client
        </button>
      </div>

      {/* Customer Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 sticky top-0 z-10 shadow-sm">
              <th className="p-4 font-bold">Client Name</th>
              <th className="p-4 font-bold">Contact Phone</th>
              <th className="p-4 font-bold hidden md:table-cell">Identity (CNIC)</th>
              <th className="p-4 font-bold hidden lg:table-cell">Source</th>
              <th className="p-4 font-bold text-center">Total Events</th>
              <th className="p-4 font-bold hidden sm:table-cell">Last Booking</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.map((c) => {
              const totalBookings = c.bookings?.length || 0;
              const dates = c.bookings?.map((b: any) => new Date(b.event_date).getTime()) || [];
              const lastDate = dates.length > 0 ? format(new Date(Math.max(...dates)), 'MMM d, yyyy') : 'Never';

              return (
                <tr 
                  key={c.id} 
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 group-hover:text-[#1F3864] transition-colors">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-700 flex items-center gap-2 mt-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}
                  </td>
                  <td className="p-4 text-sm text-gray-500 hidden md:table-cell">{c.cnic || '—'}</td>
                  <td className="p-4 text-sm text-gray-500 hidden lg:table-cell">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-semibold">{c.referral_source || 'Unknown'}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${totalBookings > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {totalBookings}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 hidden sm:table-cell flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 inline text-gray-400 mr-1" /> {lastDate}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Client Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#1F3864] transition-colors" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">No matching clients found</p>
                  <p className="text-sm">Try searching by a different name or phone number.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CONFIRM DELETE MODAL BACKDROP POPUP */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-gray-900">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-serif font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Erase Client Profile?
              </h3>
              <button onClick={() => setCustomerToDelete(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to completely erase the client profile for <strong className="text-gray-900">{customerToDelete.full_name}</strong>? This action cannot be reversed.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCustomer}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <CustomerForm 
              businessId={businessId} 
              onClose={() => setShowAddModal(false)} 
              onSuccess={handleSuccess} 
           />
        </div>
      )}
    </div>
  );
}