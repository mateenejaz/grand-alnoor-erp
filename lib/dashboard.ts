import { createClient } from '@/lib/supabase-server';

export async function getDashboardStats(businessId: string) {
  const supabase = await createClient();
  const now = new Date();
  
  // Date boundaries
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const lastDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString();

  // 1. Confirmed Bookings This Month
  const { count: thisMonthCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'Confirmed')
    .gte('event_date', firstDayThisMonth)
    .lte('event_date', lastDayThisMonth);

  // 2. Confirmed Bookings Next Month
  const { count: nextMonthCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'Confirmed')
    .gte('event_date', firstDayNextMonth)
    .lte('event_date', lastDayNextMonth);

  // 3. Revenue This Month (Mathematically Exact)
  const { data: thisMonthPayments } = await supabase
    .from('payments')
    .select('amount, payment_type')
    .eq('business_id', businessId)
    .gte('payment_date', firstDayThisMonth)
    .lte('payment_date', lastDayThisMonth);

  let revenueThisMonth = 0;
  thisMonthPayments?.forEach(p => {
    const amt = Number(p.amount) || 0;
    if (p.payment_type?.toLowerCase() === 'refund') {
      revenueThisMonth -= amt;
    } else {
      revenueThisMonth += amt;
    }
  });

  // 4. Total Outstanding Balance (All Active Contracts)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('total_amount, payments(amount, payment_type)')
    .eq('business_id', businessId)
    .eq('status', 'Active');

  let totalOutstanding = 0;
  contracts?.forEach(contract => {
    const totalAmount = Number(contract.total_amount) || 0;
    let paid = 0;
    let refunded = 0;
    
    contract.payments?.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      if (p.payment_type?.toLowerCase() === 'refund') {
        refunded += amt;
      } else {
        paid += amt;
      }
    });
    
    const effectivePaid = paid - refunded;
    const balance = totalAmount - effectivePaid;
    if (balance > 0) {
      totalOutstanding += balance;
    }
  });

  return {
    confirmedBookingsThisMonth: thisMonthCount || 0,
    confirmedBookingsNextMonth: nextMonthCount || 0,
    revenueThisMonth,
    totalOutstanding
  };
}

export async function getUpcomingEvents(businessId: string, limit = 10) {
  const supabase = await createClient();
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, time_slot, event_type, guest_count_estimate, venues(name), customers(full_name)')
    .eq('business_id', businessId)
    .eq('status', 'Confirmed')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch upcoming events", error);
    return [];
  }
  return data || [];
}

export async function getMonthlyRevenueLast6Months(businessId: string) {
  const supabase = await createClient();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Setup our 6-month empty data structure
  const chartData: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartData.push({
      monthLabel: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      total: 0
    });
  }

  // Fetch all payments from the last 6 months
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_date, payment_type')
    .eq('business_id', businessId)
    .gte('payment_date', sixMonthsAgo.toISOString());

  // Distribute payments into the correct month buckets
  payments?.forEach(p => {
    const pDate = new Date(p.payment_date);
    const pMonth = pDate.getMonth();
    const pYear = pDate.getFullYear();
    const amt = Number(p.amount) || 0;

    const targetBin = chartData.find(bin => bin.monthIndex === pMonth && bin.year === pYear);
    if (targetBin) {
      if (p.payment_type?.toLowerCase() === 'refund') {
        targetBin.total -= amt;
      } else {
        targetBin.total += amt;
      }
    }
  });

  // Clean up format for Recharts
  return chartData.map(bin => ({
    month: bin.monthLabel,
    total: bin.total
  }));
}