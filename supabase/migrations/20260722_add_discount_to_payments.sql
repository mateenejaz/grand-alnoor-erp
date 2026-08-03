-- Add discount_amount column safely without affecting existing rows
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;

-- Keep payment_type aligned with the application flow.
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN ('Advance', 'Installment', 'Final Payment', 'Refund'));

ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Other'));
