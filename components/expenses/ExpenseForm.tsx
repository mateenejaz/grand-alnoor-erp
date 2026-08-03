'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Expense, ExpenseInput, getActiveContractsForExpenses } from '@/lib/expenses';

export const EXPENSE_CATEGORIES = [
  'Catering',
  'Staff Wages',
  'Utilities',
  'Maintenance',
  'Marketing',
  'Vendor Payments',
  'Miscellaneous',
];

interface ExpenseFormProps {
  businessId: string;
  expenseToEdit?: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  onSave: (data: ExpenseInput, id?: string) => Promise<void>;
}

export default function ExpenseForm({
  businessId,
  expenseToEdit,
  isOpen,
  onClose,
  onSubmitSuccess,
  onSave,
}: ExpenseFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(today);
  const [description, setDescription] = useState<string>('');
  const [contractId, setContractId] = useState<string>('');
  const [contracts, setContracts] = useState<Array<{ id: string; customer_name?: string; event_date?: string }>>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) {
      getActiveContractsForExpenses(businessId).then((res) => setContracts(res));
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category || EXPENSE_CATEGORIES[0]);
      setAmount(expenseToEdit.amount ? expenseToEdit.amount.toString() : '');
      setExpenseDate(expenseToEdit.expense_date || today);
      setDescription(expenseToEdit.description || '');
      setContractId(expenseToEdit.contract_id || '');
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setExpenseDate(today);
      setDescription('');
      setContractId('');
    }
    setErrorMsg(null);
  }, [expenseToEdit, isOpen, today]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ExpenseInput = {
        business_id: businessId,
        category,
        amount: numericAmount,
        expense_date: expenseDate,
        description: description.trim(),
        contract_id: contractId || null,
      };

      await onSave(payload, expenseToEdit?.id);
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save expense entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            {expenseToEdit ? 'Edit Expense' : 'Record New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Expense Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detailed expense note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Link to Specific Event (Optional)
            </label>
            <select
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">General Overhead (No Contract)</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name ? `${c.customer_name} ` : ''}({c.event_date || 'No Date'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {expenseToEdit ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}