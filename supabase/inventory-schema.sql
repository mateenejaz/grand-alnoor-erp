-- 1. Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cold_drink', 'mineral_water', 'other')),
  unit TEXT NOT NULL DEFAULT 'bottle',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment')),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  reference_type TEXT CHECK (reference_type IN ('contract', 'manual')),
  reference_id UUID,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Atomic Database Stored Procedure for Purchasing Stock
CREATE OR REPLACE FUNCTION record_stock_purchase_rpc(
  p_business_id UUID,
  p_item_id UUID,
  p_quantity INT,
  p_unit_price NUMERIC(10,2),
  p_notes TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_amount NUMERIC(15,2);
  v_new_stock INT;
  v_trans_id UUID;
BEGIN
  -- Calculate total amount
  v_total_amount := p_quantity * p_unit_price;

  -- 1. Update stock on inventory_items table
  UPDATE inventory_items
  SET current_stock = current_stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id AND business_id = p_business_id
  RETURNING current_stock INTO v_new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found or business mismatch';
  END IF;

  -- 2. Insert transaction record into inventory_transactions
  INSERT INTO inventory_transactions (
    business_id,
    item_id,
    transaction_type,
    quantity,
    unit_price,
    total_amount,
    reference_type,
    notes,
    created_by
  ) VALUES (
    p_business_id,
    p_item_id,
    'purchase',
    p_quantity,
    p_unit_price,
    v_total_amount,
    'manual',
    p_notes,
    p_user_id
  )
  RETURNING id INTO v_trans_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_trans_id,
    'new_stock', v_new_stock
  );
END;
$$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies matching existing pattern (business_id scoped)
CREATE POLICY "Allow public read on inventory_items" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on inventory_items" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on inventory_items" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on inventory_items" ON inventory_items FOR DELETE USING (true);

CREATE POLICY "Allow public read on inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on inventory_transactions" ON inventory_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on inventory_transactions" ON inventory_transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on inventory_transactions" ON inventory_transactions FOR DELETE USING (true);