import { supabase } from '@/lib/accounting/accounts';

export interface DayBookEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  account: string;
  cashIn: number;
  cashOut: number;
  runningBalance: number;
  sourceType: 'payment' | 'expense' | 'journal';
  sourceId: string;
}

export interface DayBookSummary {
  totalCashIn: number;
  totalCashOut: number;
  netForPeriod: number;
}

/**
 * Combines payments, expenses, and manual journal entries into a single chronological
 * Day Book list with running balances and PKR formatting support.
 */
export async function getDayBookEntries(
  businessId: string,
  fromDate: string,
  toDate: string
): Promise<{ entries: DayBookEntry[]; summary: DayBookSummary }> {
  const isDefaultBusiness = !businessId || businessId === '00000000-0000-0000-0000-000000000000';

  // ------------------------------------------------------------------
  // SOURCE 1: Payments Table
  // ------------------------------------------------------------------
  let paymentsQuery = supabase
    .from('payments')
    .select('id, amount, payment_type, payment_date, receipt_number, payment_method, notes, contract_id')
    .gte('payment_date', fromDate)
    .lte('payment_date', toDate);

  if (!isDefaultBusiness) {
    paymentsQuery = paymentsQuery.eq('business_id', businessId);
  }

  const { data: paymentsData, error: paymentsError } = await paymentsQuery;
  if (paymentsError) {
    console.error('Error fetching payments for Day Book:', paymentsError.message);
  }

  const paymentEntries: Omit<DayBookEntry, 'runningBalance'>[] = (paymentsData || []).map((p: any) => {
    const pType = p.payment_type ? String(p.payment_type).toUpperCase() : 'PAYMENT';
    const amount = Number(p.amount || 0);
    const isRefund = String(p.payment_type).toLowerCase() === 'refund';

    const cashIn = isRefund ? 0 : amount;
    const cashOut = isRefund ? amount : 0;

    const descNote = p.notes ? ` — ${p.notes}` : '';
    const refNum = p.receipt_number || `REC-${String(p.id).substring(0, 8)}`;

    return {
      id: `PAY-${p.id}`,
      date: p.payment_date,
      reference: refNum,
      description: `Customer Payment — ${pType}${descNote}`,
      account: p.payment_method || 'Cash / Bank',
      cashIn,
      cashOut,
      sourceType: 'payment',
      sourceId: String(p.id),
    };
  });

  // ------------------------------------------------------------------
  // SOURCE 2: Expenses Table
  // ------------------------------------------------------------------
  let expensesQuery = supabase
    .from('expenses')
    .select('id, expense_date, category, description, amount')
    .gte('expense_date', fromDate)
    .lte('expense_date', toDate);

  if (!isDefaultBusiness) {
    expensesQuery = expensesQuery.eq('business_id', businessId);
  }

  const { data: expensesData, error: expensesError } = await expensesQuery;
  if (expensesError) {
    console.error('Error fetching expenses for Day Book:', expensesError.message);
  }

  const expenseEntries: Omit<DayBookEntry, 'runningBalance'>[] = (expensesData || []).map((e: any) => {
    const category = e.category || 'General Expense';
    const desc = e.description ? ` — ${e.description}` : '';

    return {
      id: `EXP-${e.id}`,
      date: e.expense_date,
      reference: `EXP-${String(e.id).substring(0, 8)}`,
      description: `${category}${desc}`,
      account: 'Cash Account',
      cashIn: 0,
      cashOut: Number(e.amount || 0),
      sourceType: 'expense',
      sourceId: String(e.id),
    };
  });

  // ------------------------------------------------------------------
  // SOURCE 3: Manual Journal Entries
  // ------------------------------------------------------------------
  let journalsQuery = supabase
    .from('journal_entries')
    .select(`
      id,
      entry_date,
      reference_number,
      description,
      journal_entry_lines (
        debit_amount,
        credit_amount,
        accounts ( code, name )
      )
    `)
    .eq('entry_type', 'manual')
    .gte('entry_date', fromDate)
    .lte('entry_date', toDate);

  if (!isDefaultBusiness) {
    journalsQuery = journalsQuery.eq('business_id', businessId);
  }

  const { data: journalsData, error: journalsError } = await journalsQuery;
  if (journalsError) {
    console.error('Error fetching manual journals for Day Book:', journalsError.message);
  }

  const journalEntries: Omit<DayBookEntry, 'runningBalance'>[] = (journalsData || []).map((j: any) => {
    let cashIn = 0;
    let cashOut = 0;

    (j.journal_entry_lines || []).forEach((line: any) => {
      const accCode = line.accounts?.code;
      // Account 1000 = Cash in Hand, 1001 = Bank Account
      if (accCode === '1000' || accCode === '1001') {
        cashIn += Number(line.debit_amount || 0);
        cashOut += Number(line.credit_amount || 0);
      }
    });

    return {
      id: `JRN-${j.id}`,
      date: j.entry_date,
      reference: j.reference_number || `JRN-${String(j.id).substring(0, 8)}`,
      description: j.description || 'Manual Journal Entry',
      account: 'Cash / Bank (1000/1001)',
      cashIn,
      cashOut,
      sourceType: 'journal',
      sourceId: String(j.id),
    };
  });

  // ------------------------------------------------------------------
  // COMBINE, SORT & CALCULATE RUNNING BALANCE
  // ------------------------------------------------------------------
  const combined = [...paymentEntries, ...expenseEntries, ...journalEntries];

  // Sort by date ascending
  combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentBalance = 0;
  let totalCashIn = 0;
  let totalCashOut = 0;

  const entriesWithBalance: DayBookEntry[] = combined.map((item) => {
    currentBalance += item.cashIn - item.cashOut;
    totalCashIn += item.cashIn;
    totalCashOut += item.cashOut;

    return {
      ...item,
      runningBalance: currentBalance,
    };
  });

  return {
    entries: entriesWithBalance,
    summary: {
      totalCashIn,
      totalCashOut,
      netForPeriod: totalCashIn - totalCashOut,
    },
  };
}