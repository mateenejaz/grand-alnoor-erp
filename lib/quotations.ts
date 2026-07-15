import { supabaseBrowser as supabase } from './supabase-client';

// PURE MATH FUNCTION: No database dependency. Safe, testable, exact.
export function calculateTotal(lineItems: any[]): number {
  return lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);
}

export async function getQuotations(businessId: string) {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, customers(full_name), bookings(event_date, venues(name))')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function getQuotationById(id: string) {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, customers(*), bookings(*, venues(*)), quotation_line_items(*)')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

export async function createQuotation(quotationData: any, lineItems: any[]) {
  // 1. Insert Main Quotation
  const { data: quote, error: quoteError } = await supabase
    .from('quotations')
    .insert([quotationData])
    .select()
    .single();
    
  if (quoteError) throw quoteError;

  // 2. Insert Line Items tied to the new quotation ID
  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map(item => ({
      quotation_id: quote.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.quantity) * Number(item.unit_price)
    }));
    
    const { error: lineError } = await supabase.from('quotation_line_items').insert(itemsToInsert);
    if (lineError) throw lineError;
  }

  return quote;
}

export async function updateQuotation(id: string, quotationData: any, lineItems: any[]) {
  // 1. Update Main Quotation
  const { data: quote, error: quoteError } = await supabase
    .from('quotations')
    .update(quotationData)
    .eq('id', id)
    .select()
    .single();
    
  if (quoteError) throw quoteError;

  // 2. Destructive Update for Line Items (Delete all, re-insert to guarantee strict sync)
  await supabase.from('quotation_line_items').delete().eq('quotation_id', id);

  if (lineItems.length > 0) {
    const itemsToInsert = lineItems.map(item => ({
      quotation_id: id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.quantity) * Number(item.unit_price)
    }));
    
    const { error: lineError } = await supabase.from('quotation_line_items').insert(itemsToInsert);
    if (lineError) throw lineError;
  }

  return quote;
}

export async function updateQuotationStatus(id: string, status: string) {
  const { error } = await supabase.from('quotations').update({ status }).eq('id', id);
  if (error) throw error;
}