'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExpenses, Expense } from '@/lib/expenses';
import ExpenseList from '@/components/expenses/ExpenseList';

export default function ExpensesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active user and default business context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Authentication required.');
        return;
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .limit(1)
        .single();

      if (!business) {
        setError('No active business context found.');
        return;
      }

      setBusinessId(business.id);
      const expenseList = await getExpenses(business.id);
      setExpenses(expenseList);
    } catch (err: any) {
      console.error('Failed to load expenses page:', err);
      setError(err.message || 'Failed to fetch expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !businessId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        <p className="font-bold">Error</p>
        <p>{error || 'Unable to identify active business profile.'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ExpenseList
        businessId={businessId}
        initialExpenses={expenses}
        onRefresh={fetchInitialData}
      />
    </div>
  );
}