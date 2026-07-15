import { supabaseBrowser as supabase } from './supabase-client';

// 1. Used by the Customers Directory page for the main table
export async function getCustomers(businessId: string, searchQuery?: string) {
  let query = supabase
    .from('customers')
    .select('*, bookings(id, event_date, status)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 2. Used by the New Booking Modal for the fast dropdown search
export async function searchCustomers(businessId: string, query: string) {
  if (!query) return [];
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);
    
  if (error) throw error;
  return data || [];
}

// 3. Gets a single customer's full profile
export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

// 4. Gets the history of bookings for a single customer
export async function getCustomerBookings(customerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, venues(name)')
    .eq('customer_id', customerId)
    .order('event_date', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

// 5. Creates a new customer
export async function createCustomer(customerData: any) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// 6. Updates an existing customer
export async function updateCustomer(id: string, customerData: any) {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}