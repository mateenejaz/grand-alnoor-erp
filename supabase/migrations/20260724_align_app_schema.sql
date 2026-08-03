-- Align the deployed database with the current ERP application contract.
-- This migration is intentionally defensive so it can run after older schema versions.

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

UPDATE venues
SET type = CASE LOWER(REPLACE(type, ' ', '_'))
  WHEN 'hall' THEN 'Hall'
  WHEN 'lawn' THEN 'Lawn'
  WHEN 'marquee' THEN 'Marquee'
  WHEN 'banquet' THEN 'Banquet'
  ELSE type
END;

ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_type_check;
ALTER TABLE venues
ADD CONSTRAINT venues_type_check
CHECK (type IN ('Hall', 'Lawn', 'Marquee', 'Banquet'));

UPDATE menu_items
SET category = CASE LOWER(category)
  WHEN 'starter' THEN 'Starter'
  WHEN 'main' THEN 'Main'
  WHEN 'dessert' THEN 'Dessert'
  WHEN 'beverage' THEN 'Beverage'
  ELSE category
END;

ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check;
ALTER TABLE menu_items
ADD CONSTRAINT menu_items_category_check
CHECK (category IN ('Starter', 'Main', 'Dessert', 'Beverage'));

UPDATE bookings
SET time_slot = CASE LOWER(REPLACE(time_slot, '_', ' '))
  WHEN 'day' THEN 'Day'
  WHEN 'evening' THEN 'Evening'
  WHEN 'full day' THEN 'Full Day'
  ELSE time_slot
END;

UPDATE bookings
SET event_type = CASE LOWER(event_type)
  WHEN 'wedding' THEN 'Wedding'
  WHEN 'walima' THEN 'Walima'
  WHEN 'engagement' THEN 'Engagement'
  WHEN 'mehndi' THEN 'Mehndi'
  WHEN 'other' THEN 'Corporate'
  ELSE event_type
END;

UPDATE bookings
SET status = CASE LOWER(status)
  WHEN 'tentative' THEN 'Tentative'
  WHEN 'confirmed' THEN 'Confirmed'
  WHEN 'cancelled' THEN 'Cancelled'
  WHEN 'completed' THEN 'Completed'
  ELSE status
END;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_time_slot_check;
ALTER TABLE bookings
ADD CONSTRAINT bookings_time_slot_check
CHECK (time_slot IN ('Day', 'Evening', 'Full Day'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_type_check;
ALTER TABLE bookings
ADD CONSTRAINT bookings_event_type_check
CHECK (event_type IN ('Wedding', 'Walima', 'Engagement', 'Mehndi', 'Corporate'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('Tentative', 'Confirmed', 'Cancelled', 'Completed'));

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT;

UPDATE quotations q
SET customer_id = b.customer_id
FROM bookings b
WHERE q.booking_id = b.id
  AND q.customer_id IS NULL;

ALTER TABLE quotations
ALTER COLUMN customer_id SET NOT NULL;

UPDATE quotations
SET status = CASE LOWER(status)
  WHEN 'draft' THEN 'Draft'
  WHEN 'sent' THEN 'Sent'
  WHEN 'accepted' THEN 'Accepted'
  WHEN 'rejected' THEN 'Rejected'
  WHEN 'expired' THEN 'Expired'
  ELSE status
END;

ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE quotations
ADD CONSTRAINT quotations_status_check
CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'));

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT;

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE contracts c
SET customer_id = b.customer_id
FROM bookings b
WHERE c.booking_id = b.id
  AND c.customer_id IS NULL;

ALTER TABLE contracts
ALTER COLUMN customer_id SET NOT NULL;

UPDATE contracts
SET status = CASE LOWER(status)
  WHEN 'active' THEN 'Active'
  WHEN 'cancelled' THEN 'Cancelled'
  WHEN 'completed' THEN 'Completed'
  ELSE status
END;

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts
ADD CONSTRAINT contracts_status_check
CHECK (status IN ('Active', 'Cancelled', 'Completed'));

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

UPDATE payments
SET payment_method = CASE LOWER(REPLACE(payment_method, '_', ' '))
  WHEN 'cash' THEN 'Cash'
  WHEN 'bank transfer' THEN 'Bank Transfer'
  WHEN 'cheque' THEN 'Cheque'
  WHEN 'other' THEN 'Other'
  ELSE payment_method
END;

UPDATE payments
SET payment_type = CASE LOWER(REPLACE(payment_type, '_', ' '))
  WHEN 'advance' THEN 'Advance'
  WHEN 'installment' THEN 'Installment'
  WHEN 'final' THEN 'Final Payment'
  WHEN 'final payment' THEN 'Final Payment'
  WHEN 'refund' THEN 'Refund'
  ELSE payment_type
END;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'Other'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments
ADD CONSTRAINT payments_payment_type_check
CHECK (payment_type IN ('Advance', 'Installment', 'Final Payment', 'Refund'));
