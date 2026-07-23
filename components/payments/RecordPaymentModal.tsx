'use client';

import { useState } from 'react';
import { X, CreditCard, Loader2, AlertTriangle } from 'lucide-react';
import { recordPayment } from '@/lib/payments';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  businessId: string;
  currentBalance: number;
}

export default function RecordPaymentModal({ isOpen, onClose, contractId, businessId, currentBalance }: RecordPaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('Cash');
  const [type, setType] = useState('Advance');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const paymentAmount = Number(amount) || 0;
  const discount = Number(discountAmount) || 0;
  const isRefund = type === 'Refund';
  
  // Real-time math preview accounting for payment and discount
  const totalDeduction = paymentAmount + discount;
  const previewBalance = isRefund 
    ? currentBalance + paymentAmount 
    : currentBalance - totalDeduction;

  const isOverpaying = !isRefund && totalDeduction > currentBalance;
  const isNegativeDiscount = discount < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentAmount <= 0 && discount <= 0) {
      return alert("Please enter a valid payment or discount amount.");
    }

    if (isNegativeDiscount) {
      return alert("Discount cannot be negative.");
    }

    if (!isRefund && totalDeduction > currentBalance) {
      return alert("Payment plus discount cannot exceed the remaining balance.");
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        business_id: businessId,
        contract_id: contractId,
        amount: paymentAmount,
        discount_amount: discount,
        payment_date: new Date(paymentDate).toISOString(),
        payment_method: method,
        payment_type: type,
        received_by: receivedBy,
        notes: notes
      });
      
      router.refresh();
      onClose();
      // Reset form on success
      setAmount('');
      setDiscountAmount('0');
      setNotes('');
    } catch (error) {
      console.error(error);
      alert("Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#B8860B] px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg"><CreditCard className="w-5 h-5" /></div>
            <h2 className="font-serif font-bold text-lg">Record Transaction</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <form id="payment-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Real-time Math Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-3 divide-x divide-gray-100 text-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Current Balance</p>
                <p className="font-bold text-gray-900 mt-1">PKR {currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">This Transaction</p>
                <p className={`font-bold mt-1 ${isRefund ? 'text-red-500' : 'text-green-500'}`}>
                  {isRefund ? '+' : '-'} PKR {totalDeduction.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">New Balance</p>
                <p className={`font-black mt-1 ${previewBalance < 0 ? 'text-red-600' : 'text-[#1F3864]'}`}>
                  PKR {previewBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {isOverpaying && (
              <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Warning: The total transaction (payment + discount) exceeds the remaining balance due.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Amount (PKR) *</label>
                <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B]" placeholder="0" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Discount (PKR)</label>
                <input type="number" min="0" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B]" placeholder="0" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Payment Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#B8860B]/20">
                  <option value="Advance">Advance / Deposit</option>
                  <option value="Installment">Installment</option>
                  <option value="Final Payment">Final Payment</option>
                  <option value="Refund">Refund (Returning Money)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#B8860B]/20">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Date</label>
                <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#B8860B]/20" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Received By (Staff Name)</label>
                <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#B8860B]/20" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Notes (Optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#B8860B]/20 resize-none" placeholder="Cheque number, bank details, or reason for discount/refund..." />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
          <button type="submit" form="payment-form" disabled={isSubmitting || isNegativeDiscount} className="px-8 py-2.5 bg-[#B8860B] hover:bg-[#986f08] text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}