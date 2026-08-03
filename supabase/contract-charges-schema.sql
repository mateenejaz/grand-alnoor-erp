-- 1. Create contract_additional_charges table
CREATE TABLE IF NOT EXISTS contract_additional_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  charge_type TEXT NOT NULL CHECK (charge_type IN ('consumable', 'other')),
  description TEXT NOT NULL,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity INT,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Atomic Database Stored Procedure for Consumable Usage Deduction
CREATE OR REPLACE FUNCTION record_stock_usage_rpc(
  p_business_id UUID,
  p_item_id UUID,
  p_quantity INT,
  p_contract_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_selling_price NUMERIC(10,2);
  v_current_stock INT;
  v_new_stock INT;
  v_total_amount NUMERIC(15,2);
  v_trans_id UUID;
  v_is_negative BOOLEAN := FALSE;
BEGIN
  -- Get item selling price and current stock
  SELECT selling_price, current_stock INTO v_selling_price, v_current_stock
  FROM inventory_items
  WHERE id = p_item_id AND business_id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found or business mismatch';
  END IF;

  v_new_stock := v_current_stock - p_quantity;
  IF v_new_stock < 0 THEN
    v_is_negative := TRUE;
  END IF;

  v_total_amount := p_quantity * v_selling_price;

  -- 1. Deduct stock from inventory_items
  UPDATE inventory_items
  SET current_stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_item_id AND business_id = p_business_id;

  -- 2. Insert transaction into inventory_transactions
  INSERT INTO inventory_transactions (
    business_id,
    item_id,
    transaction_type,
    quantity,
    unit_price,
    total_amount,
    reference_type,
    reference_id,
    notes,
    created_by
  ) VALUES (
    p_business_id,
    p_item_id,
    'usage',
    p_quantity,
    v_selling_price,
    v_total_amount,
    'contract',
    p_contract_id,
    'Added to contract final bill',
    p_user_id
  )
  RETURNING id INTO v_trans_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_trans_id,
    'new_stock', v_new_stock,
    'is_negative', v_is_negative,
    'selling_price', v_selling_price
  );
END;
$$;

-- 3. Enable RLS
ALTER TABLE contract_additional_charges ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Allow public read on contract_additional_charges" ON contract_additional_charges FOR SELECT USING (true);
CREATE POLICY "Allow public insert on contract_additional_charges" ON contract_additional_charges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on contract_additional_charges" ON contract_additional_charges FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on contract_additional_charges" ON contract_additional_charges FOR DELETE USING (true);

-- 5. Force schema cache refresh
NOTIFY pgrst, 'reload schema';