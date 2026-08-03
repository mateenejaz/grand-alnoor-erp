import { supabaseBrowser } from '@/lib/supabase-client';

export interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  category: 'cold_drink' | 'mineral_water' | 'other';
  unit: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  is_active: boolean;
  isLowStock?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  business_id: string;
  item_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment';
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference_type?: 'contract' | 'manual';
  reference_id?: string;
  notes?: string;
  transaction_date: string;
  created_by?: string;
  created_at: string;
  running_balance?: number;
}

// 1. Fetch all active inventory items with computed isLowStock
export async function getInventoryItems(businessId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabaseBrowser
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    cost_price: Number(item.cost_price),
    selling_price: Number(item.selling_price),
    current_stock: Number(item.current_stock),
    reorder_level: Number(item.reorder_level),
    isLowStock: Number(item.current_stock) <= Number(item.reorder_level),
  }));
}

// 2. Create new item
export async function createInventoryItem(data: Omit<InventoryItem, 'id' | 'isLowStock' | 'created_at' | 'updated_at'>) {
  const { data: created, error } = await supabaseBrowser
    .from('inventory_items')
    .insert([
      {
        business_id: data.business_id,
        name: data.name,
        category: data.category,
        unit: data.unit,
        cost_price: Number(data.cost_price),
        selling_price: Number(data.selling_price),
        reorder_level: Number(data.reorder_level),
        current_stock: 0,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return created;
}

// 3. Update existing item
export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.unit !== undefined) updatePayload.unit = data.unit;
  if (data.cost_price !== undefined) updatePayload.cost_price = Number(data.cost_price);
  if (data.selling_price !== undefined) updatePayload.selling_price = Number(data.selling_price);
  if (data.reorder_level !== undefined) updatePayload.reorder_level = Number(data.reorder_level);

  const { data: updated, error } = await supabaseBrowser
    .from('inventory_items')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// 4. Soft-Deactivate item
export async function deactivateInventoryItem(id: string) {
  const { error } = await supabaseBrowser
    .from('inventory_items')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  return true;
}

// 5. Record Stock Purchase (Atomic increment & ledger log)
export async function recordStockPurchase(
  businessId: string,
  itemId: string,
  quantity: number,
  unitCostPrice: number,
  notes: string = '',
  userId: string | null = null
) {
  const { data, error } = await supabaseBrowser.rpc('record_stock_purchase_rpc', {
    p_business_id: businessId,
    p_item_id: itemId,
    p_quantity: Number(quantity),
    p_unit_price: Number(unitCostPrice),
    p_notes: notes,
    p_user_id: userId,
  });

  if (!error) return data;

  console.warn('RPC record_stock_purchase_rpc failed, attempting direct updates', error);

  const { data: currentItem, error: fetchErr } = await supabaseBrowser
    .from('inventory_items')
    .select('current_stock')
    .eq('id', itemId)
    .single();

  if (fetchErr) throw fetchErr;

  const newStock = Number(currentItem.current_stock) + Number(quantity);
  const totalAmount = Number(quantity) * Number(unitCostPrice);

  const { error: updateErr } = await supabaseBrowser
    .from('inventory_items')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateErr) throw updateErr;

  const { error: transErr } = await supabaseBrowser
    .from('inventory_transactions')
    .insert([
      {
        business_id: businessId,
        item_id: itemId,
        transaction_type: 'purchase',
        quantity: Number(quantity),
        unit_price: Number(unitCostPrice),
        total_amount: totalAmount,
        reference_type: 'manual',
        notes: notes,
        created_by: userId,
      },
    ]);

  if (transErr) throw transErr;

  return { success: true, new_stock: newStock };
}

// 6. Record Stock Usage for Contracts (Atomic deduction & ledger log)
export async function recordStockUsage(
  businessId: string,
  itemId: string,
  quantity: number,
  contractId: string,
  userId: string | null = null
) {
  const { data, error } = await supabaseBrowser.rpc('record_stock_usage_rpc', {
    p_business_id: businessId,
    p_item_id: itemId,
    p_quantity: Number(quantity),
    p_contract_id: contractId,
    p_user_id: userId,
  });

  if (!error) return data;

  console.warn('RPC record_stock_usage_rpc failed, fallback direct update', error);

  const { data: item, error: fetchErr } = await supabaseBrowser
    .from('inventory_items')
    .select('current_stock, selling_price')
    .eq('id', itemId)
    .single();

  if (fetchErr) throw fetchErr;

  const sellingPrice = Number(item.selling_price);
  const newStock = Number(item.current_stock) - Number(quantity);
  const totalAmount = Number(quantity) * sellingPrice;

  const { error: updateErr } = await supabaseBrowser
    .from('inventory_items')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  if (updateErr) throw updateErr;

  const { error: transErr } = await supabaseBrowser
    .from('inventory_transactions')
    .insert([
      {
        business_id: businessId,
        item_id: itemId,
        transaction_type: 'usage',
        quantity: Number(quantity),
        unit_price: sellingPrice,
        total_amount: totalAmount,
        reference_type: 'contract',
        reference_id: contractId,
        notes: 'Added to contract final bill',
        created_by: userId,
      },
    ]);

  if (transErr) throw transErr;

  return {
    success: true,
    new_stock: newStock,
    is_negative: newStock < 0,
    selling_price: sellingPrice,
  };
}

// 7. Adjust Stock Quantity (Manual Override / Stock Correction)
export async function adjustStockQuantity(
  businessId: string,
  itemId: string,
  newStock: number,
  notes: string = 'Manual stock override/correction',
  userId: string | null = null
) {
  const { data, error } = await supabaseBrowser.rpc('adjust_stock_rpc', {
    p_business_id: businessId,
    p_item_id: itemId,
    p_new_stock: Number(newStock),
    p_notes: notes,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error adjusting stock:', error);
    throw error;
  }

  return data;
}

// 8. Fetch stock history with running stock balance
export async function getStockHistory(itemId: string): Promise<InventoryTransaction[]> {
  const { data, error } = await supabaseBrowser
    .from('inventory_transactions')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading stock history:', error);
    return [];
  }

  let cumulativeStock = 0;
  const historyWithBalance = (data || []).map((t) => {
    const qty = Number(t.quantity);
    if (t.transaction_type === 'purchase') {
      cumulativeStock += qty;
    } else if (t.transaction_type === 'usage') {
      cumulativeStock -= qty;
    } else if (t.transaction_type === 'adjustment') {
      cumulativeStock += qty;
    }

    return {
      ...t,
      quantity: qty,
      unit_price: Number(t.unit_price),
      total_amount: Number(t.total_amount),
      running_balance: cumulativeStock,
    };
  });

  return historyWithBalance.reverse();
}

// 9. Fetch items at or below reorder level (sorted most urgent first)
export async function getLowStockItems(businessId: string): Promise<InventoryItem[]> {
  const items = await getInventoryItems(businessId);
  const lowItems = items.filter((item) => item.isLowStock);

  // Sort by urgency: furthest below reorder level comes first
  lowItems.sort((a, b) => {
    const deficitA = a.current_stock - a.reorder_level;
    const deficitB = b.current_stock - b.reorder_level;
    return deficitA - deficitB;
  });

  return lowItems;
}