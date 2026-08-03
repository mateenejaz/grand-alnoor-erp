-- ==========================================
-- GRAND ALNOOR ERP: CONSUMABLES INVENTORY SYSTEM
-- ==========================================

-- 1. ENUM TYPES
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_transaction_type') THEN
    CREATE TYPE stock_transaction_type AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN');
  END IF;
END $$;

-- 2. CONSUMABLE ITEMS MASTER TABLE
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'bottles',
  current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
  reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  average_cost_pkr NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  default_selling_price_pkr NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_business ON inventory_items(business_id);

-- 3. PURCHASE LEDGER
CREATE TABLE IF NOT EXISTS stock_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_added NUMERIC(12, 2) NOT NULL CHECK (quantity_added > 0),
  purchase_unit_price_pkr NUMERIC(12, 2) NOT NULL CHECK (purchase_unit_price_pkr >= 0),
  total_cost_pkr NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_added * purchase_unit_price_pkr) STORED,
  supplier_name VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_purchases_item ON stock_purchases(item_id);

-- 4. CONTRACT CONSUMABLE BILLING ITEMS (FINAL BILLING ONLY)
CREATE TABLE IF NOT EXISTS contract_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_consumed NUMERIC(12, 2) NOT NULL CHECK (quantity_consumed > 0),
  unit_price_pkr NUMERIC(12, 2) NOT NULL CHECK (unit_price_pkr >= 0),
  total_price_pkr NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_consumed * unit_price_pkr) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_consumables_contract ON contract_consumables(contract_id);

-- 5. STOCK AUDIT LEDGER
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type stock_transaction_type NOT NULL,
  quantity_change NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_item ON stock_ledger(item_id);

-- 6. AUTOMATIC STOCK DEDUCTION FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION process_contract_consumable_deduction()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock NUMERIC(12, 2);
  v_business_id UUID;
  v_item_name VARCHAR(255);
BEGIN
  SELECT current_stock, business_id, name 
  INTO v_current_stock, v_business_id, v_item_name
  FROM inventory_items 
  WHERE id = NEW.item_id
  FOR UPDATE;

  IF v_current_stock < NEW.quantity_consumed THEN
    RAISE EXCEPTION 'Insufficient stock for "%". Available stock: %, Requested: %', 
      v_item_name, v_current_stock, NEW.quantity_consumed;
  END IF;

  UPDATE inventory_items
  SET current_stock = current_stock - NEW.quantity_consumed,
      updated_at = NOW()
  WHERE id = NEW.item_id;

  INSERT INTO stock_ledger (
    business_id,
    item_id,
    transaction_type,
    quantity_change,
    balance_after,
    reference_id,
    notes
  ) VALUES (
    v_business_id,
    NEW.item_id,
    'SALE',
    -NEW.quantity_consumed,
    v_current_stock - NEW.quantity_consumed,
    NEW.id,
    'Deducted for Contract Final Bill'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_process_contract_consumable_deduction
AFTER INSERT ON contract_consumables
FOR EACH ROW
EXECUTE FUNCTION process_contract_consumable_deduction();

-- 7. AUTOMATIC STOCK ADDITION FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION process_stock_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock NUMERIC(12, 2);
  v_current_cost NUMERIC(12, 2);
  v_new_stock NUMERIC(12, 2);
  v_new_avg_cost NUMERIC(12, 2);
BEGIN
  SELECT current_stock, average_cost_pkr 
  INTO v_current_stock, v_current_cost
  FROM inventory_items 
  WHERE id = NEW.item_id
  FOR UPDATE;

  v_new_stock := v_current_stock + NEW.quantity_added;
  
  IF v_new_stock > 0 THEN
    v_new_avg_cost := ((v_current_stock * v_current_cost) + (NEW.quantity_added * NEW.purchase_unit_price_pkr)) / v_new_stock;
  ELSE
    v_new_avg_cost := NEW.purchase_unit_price_pkr;
  END IF;

  UPDATE inventory_items
  SET current_stock = v_new_stock,
      average_cost_pkr = v_new_avg_cost,
      updated_at = NOW()
  WHERE id = NEW.item_id;

  INSERT INTO stock_ledger (
    business_id,
    item_id,
    transaction_type,
    quantity_change,
    balance_after,
    reference_id,
    notes
  ) VALUES (
    NEW.business_id,
    NEW.item_id,
    'PURCHASE',
    NEW.quantity_added,
    v_new_stock,
    NEW.id,
    COALESCE(NEW.notes, 'Stock Purchase Entry')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_process_stock_purchase
AFTER INSERT ON stock_purchases
FOR EACH ROW
EXECUTE FUNCTION process_stock_purchase();

-- 8. ROW LEVEL SECURITY POLICIES
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_consumables ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to inventory_items" 
  ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to stock_purchases" 
  ON stock_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to contract_consumables" 
  ON contract_consumables FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to stock_ledger" 
  ON stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);