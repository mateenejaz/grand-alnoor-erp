import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton pattern to prevent "Multiple GoTrueClient instances" error in Next.js
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined;
};

export const supabase =
  globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  business_id: string;
  code: string;
  name: string;
  type: AccountType;
  sub_type: string;
  description?: string | null;
  is_active: boolean;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAccountInput {
  business_id: string;
  code: string;
  name: string;
  type: AccountType;
  sub_type: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  sub_type?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Formats a numeric value into PKR format using standard international thousands grouping.
 * Example: 130000 -> PKR 130,000.00
 */
export function formatPKR(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  const formattedNum = absVal.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const result = `PKR ${formattedNum}`;
  return isNegative ? `-${result}` : result;
}

export async function getAccounts(businessId: string, typeFilter?: AccountType): Promise<Account[]> {
  let query = supabase
    .from('accounts')
    .select('*')
    .order('code', { ascending: true });

  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    query = query.eq('business_id', businessId);
  }

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching accounts:', error.message);
    return [];
  }
  return data || [];
}

export async function getAccountById(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account by ID:', error.message);
    return null;
  }
  return data;
}

export async function createAccount(data: CreateAccountInput): Promise<Account | null> {
  const { data: created, error } = await supabase
    .from('accounts')
    .insert([{ ...data, is_system: false, is_active: data.is_active ?? true }])
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', error.message);
    throw new Error(error.message);
  }
  return created;
}

export async function updateAccount(id: string, data: UpdateAccountInput): Promise<Account | null> {
  const existing = await getAccountById(id);
  if (existing?.is_system) {
    throw new Error('System accounts cannot be modified.');
  }

  const { data: updated, error } = await supabase
    .from('accounts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating account:', error.message);
    throw new Error(error.message);
  }
  return updated;
}

/**
 * Calculates the current balance of an account.
 * Includes the deduplication fix for Cash (1000) vs Bank (1001) operational payments.
 */
export async function getAccountBalance(accountId: string): Promise<number> {
  const account = await getAccountById(accountId);
  if (!account) return 0;

  const accCode = String(account.code);
  let totalDebit = 0;
  let totalCredit = 0;

  // 1. Sum Journal Entry Lines
  const { data: jLines } = await supabase
    .from('journal_entry_lines')
    .select('debit_amount, credit_amount')
    .eq('account_id', accountId);

  (jLines || []).forEach((line: any) => {
    totalDebit += Number(line.debit_amount || 0);
    totalCredit += Number(line.credit_amount || 0);
  });

  // 2. Sum Operational Payments
  if (accCode === '4000' || accCode === '1000' || accCode === '1001') {
    const { data: payments } = await supabase.from('payments').select('*');
    
    (payments || []).forEach((p: any) => {
      const method = p.payment_method ? String(p.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
      // Prevent duplication across Cash and Bank accounts
      if (accCode === '1000' && isBank) return;
      if (accCode === '1001' && !isBank) return;

      const amt = Number(p.amount || 0);
      const isRefund = String(p.payment_type).toLowerCase() === 'refund';

      if (accCode === '4000') {
        if (isRefund) totalDebit += amt;
        else totalCredit += amt;
      } else {
        if (isRefund) totalCredit += amt;
        else totalDebit += amt;
      }
    });
  }

  // 3. Sum Operational Expenses
  if (account.type === 'expense' || accCode === '1000' || accCode === '1001') {
    const { data: expenses } = await supabase.from('expenses').select('*');
    
    (expenses || []).forEach((e: any) => {
      const method = e.payment_method ? String(e.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
      // Prevent duplication across Cash and Bank accounts
      if (accCode === '1000' && isBank) return;
      if (accCode === '1001' && !isBank) return;

      const amt = Number(e.amount || 0);
      if (account.type === 'expense') {
        totalDebit += amt;
      } else {
        totalCredit += amt;
      }
    });
  }

  // Calculate final balance based on account type
  if (account.type === 'asset' || account.type === 'expense') {
    return totalDebit - totalCredit;
  } else {
    return totalCredit - totalDebit;
  }
}