import { supabase, Account, getAccountById, AccountType } from '@/lib/accounting/accounts';

export interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  entryId: string;
  sourceType: string;
  sourceId: string;
}

export interface AccountSummary {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  subType: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
}

export async function getOpeningBalance(
  accountId: string,
  beforeDate: string
): Promise<number> {
  const account = await getAccountById(accountId);
  if (!account) return 0;

  const accCode = String(account.code);
  let totalDebit = 0;
  let totalCredit = 0;

  const { data: jLines } = await supabase
    .from('journal_entry_lines')
    .select('debit_amount, credit_amount, journal_entries!inner(entry_date)')
    .eq('account_id', accountId)
    .lt('journal_entries.entry_date', beforeDate);

  (jLines || []).forEach((line: any) => {
    totalDebit += Number(line.debit_amount || 0);
    totalCredit += Number(line.credit_amount || 0);
  });

  if (accCode === '4000' || accCode === '1000' || accCode === '1001') {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .lt('payment_date', beforeDate);

    (payments || []).forEach((p: any) => {
      const method = p.payment_method ? String(p.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
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

  if (account.type === 'expense' || accCode === '1000' || accCode === '1001') {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .lt('expense_date', beforeDate);

    (expenses || []).forEach((e: any) => {
      const method = e.payment_method ? String(e.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
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

  if (account.type === 'asset' || account.type === 'expense') {
    return totalDebit - totalCredit;
  } else {
    return totalCredit - totalDebit;
  }
}

export async function getLedgerEntries(
  businessId: string,
  accountId: string,
  fromDate: string,
  toDate: string
): Promise<{
  account: Account | null;
  openingBalance: number;
  entries: LedgerEntry[];
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
}> {
  const account = await getAccountById(accountId);
  if (!account) {
    return {
      account: null,
      openingBalance: 0,
      entries: [],
      totalDebits: 0,
      totalCredits: 0,
      closingBalance: 0,
    };
  }

  const accCode = String(account.code);
  const openingBalance = await getOpeningBalance(accountId, fromDate);
  const combinedEntries: Omit<LedgerEntry, 'runningBalance'>[] = [];

  let jLinesQuery = supabase
    .from('journal_entry_lines')
    .select(`
      id,
      debit_amount,
      credit_amount,
      journal_entries!inner (
        id,
        entry_date,
        reference_number,
        description,
        entry_type
      )
    `)
    .eq('account_id', accountId)
    .gte('journal_entries.entry_date', fromDate)
    .lte('journal_entries.entry_date', toDate);

  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    jLinesQuery = jLinesQuery.eq('journal_entries.business_id', businessId);
  }

  const { data: jLines } = await jLinesQuery;

  (jLines || []).forEach((line: any) => {
    const entry = line.journal_entries;
    combinedEntries.push({
      id: `JRN-${line.id}`,
      date: entry.entry_date,
      reference: entry.reference_number || `JRN-${String(entry.id).substring(0, 8)}`,
      description: entry.description || 'Journal Entry',
      debit: Number(line.debit_amount || 0),
      credit: Number(line.credit_amount || 0),
      entryId: String(entry.id),
      sourceType: entry.entry_type || 'journal',
      sourceId: String(entry.id),
    });
  });

  if (accCode === '4000' || accCode === '1000' || accCode === '1001') {
    let paymentsQuery = supabase
      .from('payments')
      .select('*')
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate);

    if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      paymentsQuery = paymentsQuery.eq('business_id', businessId);
    }

    const { data: payments } = await paymentsQuery;

    (payments || []).forEach((p: any) => {
      const method = p.payment_method ? String(p.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
      if (accCode === '1000' && isBank) return;
      if (accCode === '1001' && !isBank) return;

      const amt = Number(p.amount || 0);
      const isRefund = String(p.payment_type).toLowerCase() === 'refund';
      const pType = p.payment_type ? String(p.payment_type).toUpperCase() : 'PAYMENT';
      const refNum = p.receipt_number || `REC-${String(p.id).substring(0, 8)}`;
      const methodTag = isBank ? '[BANK]' : '[CASH]';
      const noteStr = p.notes ? ` — ${p.notes}` : '';

      let debit = 0;
      let credit = 0;

      if (accCode === '4000') {
        if (isRefund) debit = amt;
        else credit = amt;
      } else {
        if (isRefund) credit = amt;
        else debit = amt;
      }

      combinedEntries.push({
        id: `PAY-${p.id}`,
        date: p.payment_date,
        reference: refNum,
        description: `Customer Payment ${methodTag} — ${pType}${noteStr}`,
        debit,
        credit,
        entryId: String(p.id),
        sourceType: 'payment',
        sourceId: String(p.id),
      });
    });
  }

  if (account.type === 'expense' || accCode === '1000' || accCode === '1001') {
    let expensesQuery = supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', fromDate)
      .lte('expense_date', toDate);

    if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
      expensesQuery = expensesQuery.eq('business_id', businessId);
    }

    const { data: expenses } = await expensesQuery;

    (expenses || []).forEach((e: any) => {
      const method = e.payment_method ? String(e.payment_method).toLowerCase() : 'cash';
      const isBank = method.includes('bank') || method.includes('card') || method.includes('transfer') || method.includes('online');
      
      if (accCode === '1000' && isBank) return;
      if (accCode === '1001' && !isBank) return;

      const amt = Number(e.amount || 0);
      const cat = e.category || 'General Expense';
      const methodTag = isBank ? '[BANK]' : '[CASH]';
      const descStr = e.description ? ` — ${e.description}` : '';

      let debit = 0;
      let credit = 0;

      if (account.type === 'expense') {
        debit = amt;
      } else {
        credit = amt;
      }

      combinedEntries.push({
        id: `EXP-${e.id}`,
        date: e.expense_date,
        reference: `EXP-${String(e.id).substring(0, 8)}`,
        description: `Expense ${methodTag}: ${cat}${descStr}`,
        debit,
        credit,
        entryId: String(e.id),
        sourceType: 'expense',
        sourceId: String(e.id),
      });
    });
  }

  combinedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = openingBalance;
  let totalDebits = 0;
  let totalCredits = 0;

  const entries: LedgerEntry[] = combinedEntries.map((item) => {
    totalDebits += item.debit;
    totalCredits += item.credit;

    if (account.type === 'asset' || account.type === 'expense') {
      runningBalance += item.debit - item.credit;
    } else {
      runningBalance += item.credit - item.debit;
    }

    return {
      ...item,
      runningBalance,
    };
  });

  return {
    account,
    openingBalance,
    entries,
    totalDebits,
    totalCredits,
    closingBalance: runningBalance,
  };
}

export async function getAllAccountSummaries(
  businessId: string,
  fromDate: string,
  toDate: string
): Promise<{
  summaries: AccountSummary[];
  grandTotalDebits: number;
  grandTotalCredits: number;
  isBalanced: boolean;
}> {
  let accountsQuery = supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (businessId && businessId !== '00000000-0000-0000-0000-000000000000') {
    accountsQuery = accountsQuery.eq('business_id', businessId);
  }

  const { data: accounts, error: accountsError } = await accountsQuery;

  if (accountsError || !accounts) {
    console.error('Error fetching accounts for summary:', accountsError?.message);
    return { summaries: [], grandTotalDebits: 0, grandTotalCredits: 0, isBalanced: true };
  }

  const summaries: AccountSummary[] = [];
  let grandTotalDebits = 0;
  let grandTotalCredits = 0;

  for (const account of accounts) {
    const res = await getLedgerEntries(businessId, account.id, fromDate, toDate);

    if (account.type === 'asset' || account.type === 'expense') {
      if (res.closingBalance >= 0) {
        grandTotalDebits += res.closingBalance;
      } else {
        grandTotalCredits += Math.abs(res.closingBalance);
      }
    } else {
      if (res.closingBalance >= 0) {
        grandTotalCredits += res.closingBalance;
      } else {
        grandTotalDebits += Math.abs(res.closingBalance);
      }
    }

    summaries.push({
      accountId: account.id,
      code: account.code,
      name: account.name,
      type: account.type as AccountType,
      subType: account.sub_type,
      openingBalance: res.openingBalance,
      totalDebits: res.totalDebits,
      totalCredits: res.totalCredits,
      closingBalance: res.closingBalance,
    });
  }

  const isBalanced = Math.abs(grandTotalDebits - grandTotalCredits) < 0.01;

  return {
    summaries,
    grandTotalDebits,
    grandTotalCredits,
    isBalanced,
  };
}