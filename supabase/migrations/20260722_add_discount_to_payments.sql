-- Add discount_amount column safely without affecting existing rows
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;

-- Ensure constraint allows 'Discount' as a valid payment_type if present
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN ('Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Discount', 'Other'));