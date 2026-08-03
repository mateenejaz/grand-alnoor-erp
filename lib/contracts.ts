import { supabaseBrowser as supabase } from './supabase-client';
import { recordStockUsage } from '@/lib/inventory';

export interface ContractAdditionalCharge {
  id: string;
  business_id: string;
  contract_id: string;
  charge_type: 'consumable' | 'other';
  description: string;
  item_id?: string;
  quantity?: number;
  unit_price: number;
  line_total: number;
  added_at: string;
  added_by?: string;
}

export interface ContractBalanceSummary {
  originalTotal: number;
  additionalChargesTotal: number;
  finalBillTotal: number;
  totalPaid: number;
  remainingBalance: number;
  // Legacy alias keys for backwards compatibility across existing pages
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
}

// 1. Fetch all contracts for a business
export async function getContracts(businessId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(*), bookings(*, venues(*)), payments(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 2. Fetch contract details by ID
export async function getContractById(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      customers(*),
      bookings(
        *,
        venues(*),
        customers(*)
      ),
      quotations(
        *,
        quotation_line_items(*),
        customers(*)
      ),
      payments(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// 3. Create Contract from accepted Quotation
export async function createContractFromQuotation(quotationId: string) {
  const { data: quote, error: quoteErr } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', quotationId)
    .single();

  if (quoteErr) throw quoteErr;

  const contractData = {
    business_id: quote.business_id,
    booking_id: quote.booking_id,
    quotation_id: quote.id,
    customer_id: quote.customer_id,
    total_amount: quote.total_amount,
    status: 'Active',
  };

  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .insert([contractData])
    .select()
    .single();

  if (contractErr) throw contractErr;

  await supabase.from('quotations').update({ status: 'Accepted' }).eq('id', quotationId);
  await supabase.from('bookings').update({ status: 'Confirmed' }).eq('id', quote.booking_id);

  return contract;
}

// 4. Update contract status
export async function updateContractStatus(id: string, status: string) {
  const { error } = await supabase.from('contracts').update({ status }).eq('id', id);
  if (error) throw error;
}

// 5. Get all additional charges for a contract
export async function getContractAdditionalCharges(contractId: string): Promise<ContractAdditionalCharge[]> {
  const { data, error } = await supabase
    .from('contract_additional_charges')
    .select('*')
    .eq('contract_id', contractId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching contract additional charges:', error);
    return [];
  }

  return (data || []).map((c) => ({
    ...c,
    quantity: c.quantity ? Number(c.quantity) : undefined,
    unit_price: Number(c.unit_price),
    line_total: Number(c.line_total),
  }));
}

// 6. Add Consumable Charge and deduct stock
export async function addConsumableCharge(
  businessId: string,
  contractId: string,
  itemId: string,
  quantity: number,
  userId: string | null = null
) {
  // Step 1: Fetch item selling price and name
  const { data: item, error: itemErr } = await supabase
    .from('inventory_items')
    .select('name, selling_price')
    .eq('id', itemId)
    .single();

  if (itemErr || !item) {
    throw new Error('Inventory item not found.');
  }

  const unitPrice = Number(item.selling_price);
  const lineTotal = Number(quantity) * unitPrice;
  const description = `${item.name} x ${quantity}`;

  // Step 2: Insert additional charge entry
  const { data: charge, error: chargeErr } = await supabase
    .from('contract_additional_charges')
    .insert([
      {
        business_id: businessId,
        contract_id: contractId,
        charge_type: 'consumable',
        description,
        item_id: itemId,
        quantity: Number(quantity),
        unit_price: unitPrice,
        line_total: lineTotal,
        added_by: userId,
      },
    ])
    .select()
    .single();

  if (chargeErr) {
    console.error('Failed to insert additional charge:', chargeErr);
    throw chargeErr;
  }

  // Step 3: Record inventory stock deduction
  try {
    await recordStockUsage(businessId, itemId, quantity, contractId, userId);
  } catch (stockErr) {
    // Rollback charge entry if stock deduction fails
    await supabase.from('contract_additional_charges').delete().eq('id', charge.id);
    throw new Error('Failed to update inventory stock. Charge entry was canceled.');
  }

  return charge;
}

// 7. Get comprehensive Contract Balance Summary (including additional charges)
export async function getContractBalance(id: string): Promise<ContractBalanceSummary> {
  // Fetch contract original total and payments
  const { data, error } = await supabase
    .from('contracts')
    .select('total_amount, payments(amount)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return {
      originalTotal: 0,
      additionalChargesTotal: 0,
      finalBillTotal: 0,
      totalPaid: 0,
      remainingBalance: 0,
      total_amount: 0,
      total_paid: 0,
      remaining_balance: 0,
    };
  }

  const originalTotal = Number(data.total_amount) || 0;
  const totalPaid = data.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;

  // Fetch additional charges sum for this contract
  const { data: charges } = await supabase
    .from('contract_additional_charges')
    .select('line_total')
    .eq('contract_id', id);

  const additionalChargesTotal = (charges || []).reduce(
    (sum: number, c: any) => sum + (Number(c.line_total) || 0),
    0
  );

  const finalBillTotal = originalTotal + additionalChargesTotal;
  const remainingBalance = finalBillTotal - totalPaid;

  return {
    originalTotal,
    additionalChargesTotal,
    finalBillTotal,
    totalPaid,
    remainingBalance,
    // Alias mappings
    total_amount: finalBillTotal,
    total_paid: totalPaid,
    remaining_balance: remainingBalance,
  };
}