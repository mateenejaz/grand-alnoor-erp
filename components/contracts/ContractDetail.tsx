'use client';

import { useState, useEffect } from 'react';
import {
  FileSignature,
  Calendar,
  Building,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Ban,
  Trash2,
  X,
  Edit3,
  Plus,
  Package,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateContractStatus,
  getContractAdditionalCharges,
  ContractAdditionalCharge,
} from '@/lib/contracts';
import { getContractBalance, getPaymentsByContract } from '@/lib/payments';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import PaymentHistory from '../payments/PaymentHistory';
import AddConsumablesModal from './AddConsumablesModal';
import { supabaseBrowser } from '@/lib/supabase-client';

interface ContractDetailProps {
  contract: any;
}

export default function ContractDetail({ contract }: ContractDetailProps) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConsumablesModalOpen, setIsConsumablesModalOpen] = useState(false);

  // Financial Breakdown State
  const [balanceData, setBalanceData] = useState({
    originalTotal: contract.total_amount || 0,
    additionalChargesTotal: 0,
    finalBillTotal: contract.total_amount || 0,
    totalPaid: 0,
    remainingBalance: contract.total_amount || 0,
  });

  const [payments, setPayments] = useState<any[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<ContractAdditionalCharge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(true);

  // Track contract deletion window state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Contract state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(contract.total_amount || 0);
  const [editNotes, setEditNotes] = useState<string>(contract.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Line items (Menu Items) state
  const [lineItems, setLineItems] = useState<
    Array<{ id?: string; description: string; quantity: number; unit_price: number }>
  >([]);

  // Client resolution states
  const [resolvedName, setResolvedName] = useState<string>('');
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string>(contract.customer_id || '');

  // Extract initial client name synchronously if present in initial props
  const initialClientName =
    contract.customers?.full_name ||
    contract.customers?.name ||
    contract.customers?.client_name ||
    contract.customer?.full_name ||
    contract.customer?.name ||
    contract.bookings?.customers?.full_name ||
    contract.bookings?.customers?.name ||
    contract.bookings?.customer?.full_name ||
    contract.bookings?.customer?.name ||
    contract.quotations?.customers?.full_name ||
    contract.quotations?.customers?.name ||
    contract.client_name ||
    contract.customer_name;

  // Fetch line items (Menu) when Edit Modal opens
  useEffect(() => {
    if (showEditModal && (contract?.quotation_id || contract?.id)) {
      const qId = contract.quotation_id || contract.id;
      supabaseBrowser
        .from('quotation_line_items')
        .select('*')
        .eq('quotation_id', qId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLineItems(
              data.map((i) => ({
                id: i.id,
                description: i.description || '',
                quantity: Number(i.quantity) || 1,
                unit_price: Number(i.unit_price) || 0,
              }))
            );
          } else {
            setLineItems([
              { description: '', quantity: contract.bookings?.guest_count_estimate || 100, unit_price: 0 },
            ]);
          }
        });
    }
  }, [showEditModal, contract]);

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: contract.bookings?.guest_count_estimate || 100, unit_price: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Comprehensive fallback effect to locate customer details regardless of table structure
  useEffect(() => {
    async function resolveCustomer() {
      if (initialClientName) {
        setResolvedName(initialClientName);
        return;
      }

      try {
        let targetCustId = contract.customer_id;

        if (!targetCustId && contract.booking_id) {
          const { data: bkg } = await supabaseBrowser
            .from('bookings')
            .select('*')
            .eq('id', contract.booking_id)
            .single();

          if (bkg) {
            targetCustId = bkg.customer_id || bkg.client_id;
            const directBookingName = bkg.client_name || bkg.customer_name || bkg.name;
            if (directBookingName) {
              setResolvedName(directBookingName);
              if (targetCustId) setResolvedCustomerId(targetCustId);
              return;
            }
          }
        }

        if (!targetCustId && contract.quotation_id) {
          const { data: quote } = await supabaseBrowser
            .from('quotations')
            .select('*')
            .eq('id', contract.quotation_id)
            .single();

          if (quote) {
            targetCustId = quote.customer_id || quote.client_id;
            const directQuoteName = quote.client_name || quote.customer_name || quote.name;
            if (directQuoteName) {
              setResolvedName(directQuoteName);
              if (targetCustId) setResolvedCustomerId(targetCustId);
              return;
            }
          }
        }

        if (targetCustId) {
          setResolvedCustomerId(targetCustId);
          const { data: cust } = await supabaseBrowser
            .from('customers')
            .select('*')
            .eq('id', targetCustId)
            .single();

          if (cust) {
            const foundName = cust.full_name || cust.name || cust.client_name || cust.customer_name;
            if (foundName) setResolvedName(foundName);
          }
        }
      } catch (err) {
        console.error('Error resolving customer name:', err);
      }
    }

    resolveCustomer();
  }, [contract, initialClientName]);

  // Final display values
  const clientName = resolvedName || initialClientName || 'Client / Customer';
  const customerId = resolvedCustomerId || contract.customer_id;

  // Fetch balances & additional consumable charges dynamically
  const loadFinancesAndCharges = async () => {
    setLoadingCharges(true);
    try {
      const [bal, pays, charges] = await Promise.all([
        getContractBalance(contract.id),
        getPaymentsByContract(contract.id),
        getContractAdditionalCharges(contract.id),
      ]);

      const originalTotal = Number(contract.total_amount || 0);
      const additionalChargesTotal = charges.reduce((sum, c) => sum + Number(c.line_total || 0), 0);
      const finalBillTotal = originalTotal + additionalChargesTotal;
      // Fixed: Access totalPaid via bal.totalPaid safely
      const totalPaid = Number(bal?.totalPaid ?? 0);
      const remainingBalance = finalBillTotal - totalPaid;

      setBalanceData({
        originalTotal,
        additionalChargesTotal,
        finalBillTotal,
        totalPaid,
        remainingBalance,
      });

      setPayments(pays);
      setAdditionalCharges(charges);
    } catch (err) {
      console.error('Failed to load finances and charges:', err);
    } finally {
      setLoadingCharges(false);
    }
  };

  useEffect(() => {
    if (contract.id) loadFinancesAndCharges();
  }, [contract.id, isPaymentModalOpen, showEditModal]);

  const isPaidInFull = balanceData.remainingBalance <= 0 && balanceData.finalBillTotal > 0;
  const displayDate = contract.signed_date ? new Date(contract.signed_date) : new Date(contract.created_at);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'Cancelled') {
      const confirm = window.confirm(
        'Are you sure you want to cancel this contract? This cannot be easily undone.'
      );
      if (!confirm) return;
    }
    try {
      await updateContractStatus(contract.id, newStatus);
      router.refresh();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const validItems = lineItems.filter((item) => item.description.trim() !== '');
      const calculatedTotal = validItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
        0
      );

      const finalAmount = calculatedTotal > 0 ? calculatedTotal : Number(editTotalAmount);

      const { error } = await supabaseBrowser
        .from('contracts')
        .update({
          total_amount: finalAmount,
          notes: editNotes,
        })
        .eq('id', contract.id);

      if (error) throw error;

      const qId = contract.quotation_id || contract.id;
      if (qId) {
        await supabaseBrowser.from('quotation_line_items').delete().eq('quotation_id', qId);

        if (validItems.length > 0) {
          await supabaseBrowser.from('quotation_line_items').insert(
            validItems.map((item) => ({
              quotation_id: qId,
              description: item.description,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              line_total: Number(item.quantity) * Number(item.unit_price),
            }))
          );
        }

        if (contract.quotation_id) {
          await supabaseBrowser
            .from('quotations')
            .update({ total_amount: finalAmount })
            .eq('id', contract.quotation_id);
        }
      }

      setShowEditModal(false);
      loadFinancesAndCharges();
      router.refresh();
    } catch (err) {
      console.error('Failed to update contract:', err);
      alert('Could not update contract terms and menu. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteContract = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabaseBrowser.from('contracts').delete().eq('id', contract.id);

      if (error) throw error;

      router.push('/dashboard/contracts');
      router.refresh();
    } catch (err) {
      console.error('Deletion failure error:', err);
      alert('Could not remove this contract file. Please delete linked payments first.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              contract.status === 'Active'
                ? 'bg-green-50 text-green-600'
                : contract.status === 'Completed'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">
              Contract #{contract.id.split('-')[0].toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Signed on: {format(displayDate, 'MMMM do, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Consumables Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsConsumablesModalOpen(true)}
            className="px-4 py-2 bg-[#B8860B] hover:bg-[#986f08] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Add Consumables
          </button>

          <span
            className={`px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${
              contract.status === 'Active'
                ? 'bg-green-100 text-green-700'
                : contract.status === 'Completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {contract.status}
          </span>

          <div className="flex items-center gap-1.5 border-l border-gray-100 pl-3">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-400 hover:text-[#1F3864] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
              title="Edit Contract Terms / Menu"
            >
              <Edit3 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Permanently Delete Contract"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {contract.status === 'Active' && (
              <button
                onClick={() => handleStatusChange('Cancelled')}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cancel Contract"
              >
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
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently erase{' '}
              <strong className="text-gray-900">
                Contract #{contract.id.split('-')[0].toUpperCase()}
              </strong>{' '}
              from the system logs?
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

      {/* EDIT CONTRACT & MENU MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 text-gray-900">
            <div className="flex justify-between items-start border-b pb-3">
              <h3 className="text-lg font-serif font-bold text-[#1F3864] flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Edit Contract Terms & Menu
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateContract} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Original Contract Base Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
                />
              </div>

              {/* Line Items / Menu Dishes Section */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Menu Items / Catering Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs font-bold text-[#1F3864] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Dish / Item
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100"
                    >
                      <input
                        type="text"
                        placeholder="Dish Name (e.g. Chicken Biryani)"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-medium"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs text-center font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs text-right font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Menu & Event Notes / Special Requests
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Added Mutton Karahi, extra guests count, custom stage lighting..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-[#1F3864] hover:bg-[#152644] text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prominent Financial Breakdown Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Original Total
          </p>
          <p className="text-lg font-bold text-gray-700 mt-1">
            PKR {balanceData.originalTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Add. Charges
          </p>
          <p className="text-lg font-bold text-[#B8860B] mt-1">
            + PKR {balanceData.additionalChargesTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Final Bill Total
          </p>
          <p className="text-lg font-black text-[#1F3864] mt-1">
            PKR {balanceData.finalBillTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Total Paid
          </p>
          <p className="text-lg font-bold text-green-700 mt-1">
            PKR {balanceData.totalPaid.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1F3864] text-white p-4 rounded-2xl shadow-md flex flex-col justify-between col-span-1 sm:col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
            Remaining Balance
          </p>
          <p className="text-xl font-black text-amber-300 mt-1">
            PKR {balanceData.remainingBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Consumable Charges & Payment History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client & Booking Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Event & Client Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Client Name
                </p>
                {customerId ? (
                  <Link
                    href={`/dashboard/customers/${customerId}`}
                    className="font-semibold text-[#1F3864] hover:underline text-lg"
                  >
                    {clientName}
                  </Link>
                ) : (
                  <p className="font-semibold text-gray-900 text-lg">{clientName}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Venue & Setup
                </p>
                <p className="font-semibold text-gray-900">
                  {contract.bookings?.venues?.name || 'Standard Venue'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Event Date & Time
                </p>
                <p className="font-bold text-gray-900">
                  {contract.bookings?.event_date
                    ? format(new Date(contract.bookings.event_date), 'EEEE, MMMM do, yyyy')
                    : 'TBD'}{' '}
                  • {contract.bookings?.time_slot || 'Standard Slot'}
                </p>
              </div>
            </div>

            {contract.notes && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Menu & Event Revisions / Notes
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                  {contract.notes}
                </p>
              </div>
            )}
          </div>

          {/* Additional Consumable Charges Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold font-serif text-[#1F3864] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#B8860B]" /> Additional Consumable Charges
              </h3>
              <span className="text-xs text-gray-400 font-medium">
                {additionalCharges.length}{' '}
                {additionalCharges.length === 1 ? 'item' : 'items'} added
              </span>
            </div>

            {loadingCharges ? (
              <div className="py-6 text-center text-xs text-gray-400">Loading charges...</div>
            ) : additionalCharges.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  No additional consumables added to this bill yet.
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Click "Add Consumables" above to charge cold drinks or mineral water.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Quantity</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                      <th className="py-3 px-4 text-right">Added At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {additionalCharges.map((charge) => (
                      <tr key={charge.id} className="hover:bg-gray-50/80">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {charge.description}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                          {charge.quantity || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-600">
                          PKR {charge.unit_price.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-[#1F3864]">
                          PKR {charge.line_total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-400">
                          {format(new Date(charge.added_at), 'MMM d, h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Logs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Transaction History
            </h3>
            <PaymentHistory payments={payments} />
          </div>
        </div>

        {/* Right Column: Financial Highlights Card */}
        <div className="space-y-6">
          <div className="bg-[#1F3864] p-6 rounded-2xl shadow-md text-white">
            <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
              Financial Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-100">Original Base</span>
                <span className="font-bold">PKR {balanceData.originalTotal.toLocaleString()}</span>
              </div>

              {balanceData.additionalChargesTotal > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-300">Add. Consumables</span>
                  <span className="font-bold text-amber-300">
                    + PKR {balanceData.additionalChargesTotal.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2 border-t border-white/10">
                <span className="text-white font-bold">Final Bill Total</span>
                <span className="font-black text-white text-base">
                  PKR {balanceData.finalBillTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-100">Total Paid</span>
                <span className="font-bold text-green-400">
                  PKR {balanceData.totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="pt-4 border-t border-white/20">
                <p className="text-xs text-blue-200 font-bold uppercase tracking-widest mb-1">
                  Remaining Balance
                </p>
                <p className="text-3xl font-black font-serif text-amber-300">
                  PKR {balanceData.remainingBalance.toLocaleString()}
                </p>
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
                A balance of{' '}
                <strong>PKR {balanceData.remainingBalance.toLocaleString()}</strong> is
                outstanding. Ensure final payment is collected prior to the event date.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        contractId={contract.id}
        businessId={contract.business_id}
        currentBalance={balanceData.remainingBalance}
      />

      {/* Add Consumables Modal */}
      <AddConsumablesModal
        isOpen={isConsumablesModalOpen}
        onClose={() => setIsConsumablesModalOpen(false)}
        onSuccess={loadFinancesAndCharges}
        businessId={contract.business_id}
        contractId={contract.id}
      />
    </div>
  );
}