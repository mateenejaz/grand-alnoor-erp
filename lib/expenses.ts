import { supabase } from '@/lib/supabase';

export interface Expense {
  id: string;
  business_id: string;
  contract_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  created_at?: string;
  contracts?: {
    id: string;
    customer_name?: string;
    event_date?: string;
  } | null;
}

export interface ExpenseInput {
  business_id: string;
  contract_id?: string | null;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
}

export async function getExpenses(
  businessId: string,
  fromDate?: string,
  toDate?: string,
  category?: string
) {
  let query = supabase
    .from('expenses')
    .select('*, contracts(id, customer_name, event_date)')
    .eq('business_id', businessId)
    .order('expense_date', { ascending: false });

  if (fromDate) {
    query = query.gte('expense_date', fromDate);
  }
  if (toDate) {
    query = query.lte('expense_date', toDate);
  }
  if (category && category !== 'ALL') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
  return data as Expense[];
}

export async function createExpense(data: ExpenseInput) {
  const { data: created, error } = await supabase
    .from('expenses')
    .insert([
      {
        business_id: data.business_id,
        contract_id: data.contract_id || null,
        category: data.category,
        amount: Number(data.amount),
        expense_date: data.expense_date,
        description: data.description,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
  return created as Expense;
}

export async function updateExpense(id: string, data: Partial<ExpenseInput>) {
  const payload: Record<string, any> = {};

  if (data.category !== undefined) payload.category = data.category;
  if (data.amount !== undefined) payload.amount = Number(data.amount);
  if (data.expense_date !== undefined) payload.expense_date = data.expense_date;
  if (data.description !== undefined) payload.description = data.description;
  if (data.contract_id !== undefined) payload.contract_id = data.contract_id || null;

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
  return updated as Expense;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
  return true;
}

export async function getActiveContractsForExpenses(businessId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, customer_name, event_date')
    .eq('business_id', businessId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching contracts for expenses dropdown:', error);
    return [];
  }
  return data || [];
}