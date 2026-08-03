export interface InventoryItem {
    id: string;
    business_id: string;
    name: string;
    unit_of_measure: string;
    current_stock: number;
    reorder_level: number;
    average_cost_pkr: number;
    default_selling_price_pkr: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface StockPurchase {
    id: string;
    business_id: string;
    item_id: string;
    quantity_added: number;
    purchase_unit_price_pkr: number;
    total_cost_pkr: number;
    supplier_name?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
    inventory_items?: {
      name: string;
      unit_of_measure: string;
    };
  }
  
  export interface ContractConsumable {
    id: string;
    contract_id: string;
    item_id: string;
    quantity_consumed: number;
    unit_price_pkr: number;
    total_price_pkr: number;
    created_at: string;
    inventory_items?: {
      name: string;
      unit_of_measure: string;
    };
  }
  
  export interface StockLedgerEntry {
    id: string;
    business_id: string;
    item_id: string;
    transaction_type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
    quantity_change: number;
    balance_after: number;
    reference_id?: string;
    notes?: string;
    created_at: string;
    inventory_items?: {
      name: string;
    };
  }