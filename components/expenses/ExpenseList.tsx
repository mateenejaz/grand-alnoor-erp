'use client';

import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Calendar, Filter, Receipt } from 'lucide-react';
import { Expense, ExpenseInput, deleteExpense, createExpense, updateExpense } from '@/lib/expenses';
import ExpenseForm, { EXPENSE_CATEGORIES } from './ExpenseForm';

interface ExpenseListProps {
  businessId: string;
  initialExpenses: Expense[];
  onRefresh: () => void;
}

export default function ExpenseList({
  businessId,
  initialExpenses,
  onRefresh,
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useMemo(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses.reduce((sum, item) => {
      const d = new Date(item.expense_date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
        return false;
      }
      if (fromDate && exp.expense_date < fromDate) {
        return false;
      }
      if (toDate && exp.expense_date > toDate) {
        return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, fromDate, toDate]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      setDeletingId(id);
      await deleteExpense(id);
      onRefresh();
    } catch (error) {
      alert('Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveExpense = async (data: ExpenseInput, id?: string) => {
    if (id) {
      await updateExpense(id, data);
    } else {
      await createExpense(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Expenses</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track hall operation costs, event expenses, and vendor payments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Total Expenses This Month
            </p>
            <p className="text-2xl font-black text-amber-950 mt-0.5">
              PKR {totalThisMonth.toLocaleString('en-PK')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Filter className="w-4 h-4 text-gray-400" /> Filters:
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {(selectedCategory !== 'ALL' || fromDate || toDate) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setFromDate('');
                setToDate('');
              }}
              className="text-xs text-amber-600 hover:underline font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Linked Event</th>
                <th className="py-3.5 px-4 text-right">Amount (PKR)</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      {expense.expense_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded-md text-[11px]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="py-3.5 px-4">
                      {expense.contracts ? (
                        <span className="text-amber-800 font-medium">
                          {expense.contracts.customer_name || 'Event'} (
                          {expense.contracts.event_date || 'No Date'})
                        </span>
                      ) : (
                        <span className="text-gray-400 font-light">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      Rs. {Number(expense.amount).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseForm
        businessId={businessId}
        expenseToEdit={editingExpense}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitSuccess={onRefresh}
        onSave={handleSaveExpense}
      />
    </div>
  );
}