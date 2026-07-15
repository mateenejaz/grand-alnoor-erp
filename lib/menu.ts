import { supabaseBrowser as supabase } from './supabase-client';

// --- MENU PACKAGES ---
export async function getPackages(businessId: string) {
  const { data, error } = await supabase
    .from('menu_packages')
    .select('*, package_items(item_id)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function createPackage(packageData: any) {
  const { data, error } = await supabase
    .from('menu_packages')
    .insert([packageData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updatePackage(id: string, packageData: any) {
  const { data, error } = await supabase
    .from('menu_packages')
    .update(packageData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// --- MENU ITEMS ---
export async function getMenuItems(businessId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('business_id', businessId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
    
  if (error) throw error;
  return data || [];
}

export async function createMenuItem(itemData: any) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([itemData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id: string, itemData: any) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(itemData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// --- PACKAGE ITEMS LINKING ---
export async function getPackageItems(packageId: string) {
  const { data, error } = await supabase
    .from('package_items')
    .select('item_id')
    .eq('package_id', packageId);
    
  if (error) throw error;
  return data || [];
}

export async function addItemToPackage(packageId: string, itemId: string) {
  const { error } = await supabase
    .from('package_items')
    .insert([{ package_id: packageId, item_id: itemId }]);
    
  if (error) throw error;
}

export async function removeItemFromPackage(packageId: string, itemId: string) {
  const { error } = await supabase
    .from('package_items')
    .delete()
    .eq('package_id', packageId)
    .eq('item_id', itemId);
    
  if (error) throw error;
}

// Helper to wipe and rewrite checklist items instantly
export async function syncPackageItems(packageId: string, itemIds: string[]) {
  await supabase.from('package_items').delete().eq('package_id', packageId);
  
  if (itemIds.length > 0) {
    const inserts = itemIds.map(id => ({ package_id: packageId, item_id: id }));
    const { error } = await supabase.from('package_items').insert(inserts);
    if (error) throw error;
  }
}