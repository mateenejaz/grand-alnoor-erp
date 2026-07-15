import { supabaseBrowser as supabase } from './supabase-client';

export async function getPaymentsByContract(contractId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('contract_id', contractId)
    .order('payment_date', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getAllPayments(businessId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('payments')
    .select('*, contracts(id, bookings(event_date, venues(name)), customers(full_name))')
    .eq('business_id', businessId)
    .order('payment_date', { ascending: false });

  if (startDate) query = query.gte('payment_date', startDate);
  if (endDate) query = query.lte('payment_date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function recordPayment(paymentData: any) {
  // Generate Receipt Number (e.g., GA-2026-0001)
  const year = new Date(paymentData.payment_date).getFullYear();
  
  // Count how many payments exist in this specific year to get the next number
  const { count, error: countError } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', paymentData.business_id)
    .gte('payment_date', `${year}-01-01T00:00:00Z`)
    .lte('payment_date', `${year}-12-31T23:59:59Z`);

  if (countError) throw countError;

  const nextNumber = (count || 0) + 1;
  const formattedNumber = nextNumber.toString().padStart(4, '0');
  const receipt_number = `GA-${year}-${formattedNumber}`;

  // Insert the payment
  const { data, error } = await supabase
    .from('payments')
    .insert([{ ...paymentData, receipt_number }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getContractBalance(contractId: string) {
  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .select('total_amount, payments(amount, payment_type)')
    .eq('id', contractId)
    .single();

  if (contractErr) throw contractErr;

  const totalAmount = Number(contract.total_amount) || 0;
  
  let totalPaid = 0;
  let totalRefunded = 0;

  if (contract.payments) {
    contract.payments.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      if (p.payment_type?.toLowerCase() === 'refund') {
        totalRefunded += amt;
      } else {
        totalPaid += amt;
      }
    });
  }

  // Exact math: Money taken IN minus money given BACK OUT
  const effectivePaid = totalPaid - totalRefunded;
  const remainingBalance = totalAmount - effectivePaid;

  return { 
    totalAmount, 
    totalPaid: effectivePaid, 
    rawTotalReceived: totalPaid,
    totalRefunded,
    remainingBalance 
  };
}

export async function getMonthlyRevenue(businessId: string, year: number, month: number) {
  // JavaScript months are 0-indexed, so month 6 is July. 
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString(); // Last day of month

  const { data, error } = await supabase
    .from('payments')
    .select('amount, payment_type')
    .eq('business_id', businessId)
    .gte('payment_date', start)
    .lte('payment_date', end);

  if (error) throw error;

  let totalRevenue = 0;
  data?.forEach(p => {
    const amt = Number(p.amount) || 0;
    if (p.payment_type?.toLowerCase() === 'refund') {
      totalRevenue -= amt;
    } else {
      totalRevenue += amt;
    }
  });

  return totalRevenue;
}

export async function getTotalOutstanding(businessId: string) {
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id')
    .eq('business_id', businessId)
    .eq('status', 'Active');

  if (error) throw error;
  if (!contracts || contracts.length === 0) return 0;

  let totalOutstanding = 0;
  for (const contract of contracts) {
    const balance = await getContractBalance(contract.id);
    if (balance.remainingBalance > 0) {
      totalOutstanding += balance.remainingBalance;
    }
  }

  return totalOutstanding;
}