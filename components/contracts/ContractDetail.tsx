'use client';

import { useState, useEffect } from 'react';
import { FileSignature, Calendar, Building, User, CreditCard, AlertTriangle, CheckCircle, Ban, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateContractStatus } from '@/lib/contracts';
import { getContractBalance, getPaymentsByContract } from '@/lib/payments';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import PaymentHistory from '../payments/PaymentHistory';
import { supabaseBrowser } from '@/lib/supabase-client';

interface ContractDetailProps {
  contract: any;
}

export default function ContractDetail({ contract }: ContractDetailProps) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [balanceData, setBalanceData] = useState({ remainingBalance: 0, totalPaid: 0, totalAmount: 0 });
  const [payments, setPayments] = useState<any[]>([]);
  
  // Track contract deletion window state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch the mathematically exact balances from the server dynamically
  useEffect(() => {
    async function loadFinances() {
      try {
        const bal = await getContractBalance(contract.id);
        const pays = await getPaymentsByContract(contract.id);
        setBalanceData(bal);
        setPayments(pays);
      } catch (err) {
        console.error("Failed to load finances", err);
      }
    }
    loadFinances();
  }, [contract.id, isPaymentModalOpen]); // Reload when modal closes

  const isPaidInFull = balanceData.remainingBalance <= 0 && balanceData.totalAmount > 0;
  const displayDate = contract.signed_date ? new Date(contract.signed_date) : new Date(contract.created_at);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'Cancelled') {
      const confirm = window.confirm("Are you sure you want to cancel this contract? This cannot be easily undone.");
      if (!confirm) return;
    }
    try {
      await updateContractStatus(contract.id, newStatus);
      router.refresh();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDeleteContract = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabaseBrowser
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;

      // Send the user out of this screen back to the main contract dashboard overview sheet
      router.push('/dashboard/contracts');
      router.refresh();
    } catch (err) {
      console.error("Deletion failure error:", err);
      alert("Could not remove this contract file. Please verify if it still contains payment receipt history data records linked to it. Delete payments first.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${contract.status === 'Active' ? 'bg-green-50 text-green-600' : contract.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Contract #{contract.id.split('-')[0].toUpperCase()}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Signed on: {format(displayDate, 'MMMM do, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${contract.status === 'Active' ? 'bg-green-100 text-green-700' : contract.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
            {contract.status}
          </span>
          
          <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
            {/* NEW PERMANENT DELETE BUTTON ICON */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Permanently Delete Contract"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {contract.status === 'Active' && (
              <button onClick={() => handleStatusChange('Cancelled')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Contract">
                <Ban className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL BACKDROP POPUP */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-gray-900">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-serif font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Contract Entry?
              </h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently erase <strong className="text-gray-900">Contract #{contract.id.split('-')[0].toUpperCase()}</strong> from the system logs? This will destroy the document profile sheet record entirely.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteContract}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Contract'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & History */}
        <div className="space-y-6 lg:col-span-2">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Event & Client Details</h3>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Client Name</p>
                  <Link href={`/dashboard/customers/${contract.customer_id}`} className="font-semibold text-[#1F3864] hover:underline text-lg">
                    {contract.customers?.full_name}
                  </Link>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Venue & Setup</p>
                  <p className="font-semibold text-gray-900">{contract.bookings?.venues?.name}</p>
               </div>
               <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Event Date & Time</p>
                  <p className="font-bold text-gray-900">{contract.bookings?.event_date ? format(new Date(contract.bookings.event_date), 'EEEE, MMMM do, yyyy') : 'TBD'} • {contract.bookings?.time_slot}</p>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Transaction History</h3>
            <PaymentHistory payments={payments} />
          </div>

        </div>

        {/* Right Column: Financials */}
        <div className="space-y-6">
          <div className="bg-[#1F3864] p-6 rounded-2xl shadow-md text-white">
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Financial Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100">Contract Total</span>
                <span className="font-bold">PKR {balanceData.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-100">Effective Paid</span>
                <span className="font-bold text-green-400">PKR {balanceData.totalPaid.toLocaleString()}</span>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs text-blue-200 font-bold uppercase tracking-widest mb-1">Remaining Balance</p>
                <p className="text-3xl font-black font-serif">PKR {balanceData.remainingBalance.toLocaleString()}</p>
              </div>
            </div>

            {isPaidInFull ? (
               <div className="mt-6 bg-green-500/20 text-green-300 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border border-green-500/30">
                 <CheckCircle className="w-5 h-5" /> Paid in Full
               </div>
            ) : (
               <button 
                 onClick={() => setIsPaymentModalOpen(true)} 
                 className="w-full mt-6 py-3 bg-[#B8860B] hover:bg-[#986f08] text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
               >
                 <CreditCard className="w-5 h-5" /> Record Payment
               </button>
            )}
          </div>
          
          {balanceData.remainingBalance > 0 && contract.status === 'Active' && (
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3 text-orange-800">
               <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
               <p className="text-xs font-medium leading-relaxed">
                 A balance of <strong>PKR {balanceData.remainingBalance.toLocaleString()}</strong> is outstanding. Ensure final payment is collected prior to the event date.
               </p>
             </div>
          )}
        </div>
      </div>

      <RecordPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        contractId={contract.id}
        businessId={contract.business_id}
        currentBalance={balanceData.remainingBalance}
      />
    </div>
  );
}