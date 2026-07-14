import { createClient } from '@supabase/supabase-js';

// We use the pure client so it works flawlessly inside browser components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export async function createCustomer(customerData: any) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}