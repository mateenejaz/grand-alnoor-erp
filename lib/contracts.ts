import { supabaseBrowser as supabase } from './supabase-client';

export async function getContracts(businessId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(full_name), bookings(event_date, venues(name)), payments(amount)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getContractById(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(*), bookings(*, venues(*)), quotations(*, quotation_line_items(*)), payments(*)')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function createContractFromQuotation(quotationId: string) {
  // 1. Fetch Quotation to get exact amounts and IDs
  const { data: quote, error: quoteErr } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();
    
  if (quoteErr) throw quoteErr;

  // 2. Insert the new Contract
  const contractData = {
    business_id: quote.business_id,
    booking_id: quote.booking_id,
    quotation_id: quote.id,
    customer_id: quote.customer_id,
    total_amount: quote.total_amount,
    status: 'Active'
  };
  
  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .insert([contractData])
    .select()
    .single();
    
  if (contractErr) throw contractErr;

  // 3. Upgrade Quotation Status
  await supabase.from('quotations').update({ status: 'Accepted' }).eq('id', quotationId);

  // 4. Lock the Calendar Booking (Set to Confirmed)
  await supabase.from('bookings').update({ status: 'Confirmed' }).eq('id', quote.booking_id);

  return contract;
}

export async function updateContractStatus(id: string, status: string) {
  const { error } = await supabase.from('contracts').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getContractBalance(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('total_amount, payments(amount)')
    .eq('id', id)
    .single();
    
  if (error) throw error;

  const totalAmount = Number(data.total_amount) || 0;
  const totalPaid = data.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
  const remainingBalance = totalAmount - totalPaid;

  return { total_amount: totalAmount, total_paid: totalPaid, remaining_balance: remainingBalance };
}