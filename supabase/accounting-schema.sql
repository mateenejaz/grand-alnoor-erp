-- ====================================================================
-- Grand Alnoor ERP - Phase 2: Financial Accounting Schema (Fixed Seed)
-- ====================================================================

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    sub_type TEXT NOT NULL CHECK (
        sub_type IN (
            'current_asset', 'fixed_asset', 'non_current_asset',
            'current_liability', 'long_term_liability',
            'equity',
            'revenue', 'other_income',
            'cost_of_sales', 'overhead', 'operating_expense'
        )
    ),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_account_code_per_business UNIQUE (business_id, code)
);

-- 2. ACCOUNTING PERIODS TABLE
CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_period_per_business UNIQUE (business_id, year, month)
);

-- 3. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period_id UUID REFERENCES accounting_periods(id) ON DELETE SET NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT NOT NULL,
    description TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('automatic', 'manual')),
    source_type TEXT CHECK (source_type IN ('payment', 'expense', 'contract', 'manual')),
    source_id UUID,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_reference_per_business UNIQUE (business_id, reference_number)
);

-- 4. JOURNAL ENTRY LINES TABLE
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),
    description TEXT,
    CONSTRAINT check_debit_xor_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read accounts" ON accounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert accounts" ON accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update accounts" ON accounts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete non-system accounts" ON accounts FOR DELETE USING (is_system = false);

CREATE POLICY "Allow public read accounting_periods" ON accounting_periods FOR SELECT USING (true);
CREATE POLICY "Allow public insert accounting_periods" ON accounting_periods FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update accounting_periods" ON accounting_periods FOR UPDATE USING (true);

CREATE POLICY "Allow public read journal_entries" ON journal_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert journal_entries" ON journal_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update journal_entries" ON journal_entries FOR UPDATE USING (true);

CREATE POLICY "Allow public read journal_entry_lines" ON journal_entry_lines FOR SELECT USING (true);
CREATE POLICY "Allow public insert journal_entry_lines" ON journal_entry_lines FOR INSERT WITH CHECK (true);

-- ====================================================================
-- AUTOMATIC DYNAMIC SEEDING FOR GRAND ALNOOR
-- ====================================================================

DO $$
DECLARE
    target_business_id UUID;
BEGIN
    -- 1. Fetch the first existing business ID from your businesses table
    SELECT id INTO target_business_id FROM businesses LIMIT 1;

    -- 2. If no business exists yet, create Grand Alnoor automatically
    IF target_business_id IS NULL THEN
        INSERT INTO businesses (name)
        VALUES ('Grand Alnoor')
        RETURNING id INTO target_business_id;
    END IF;

    -- 3. Insert default Chart of Accounts linked to your real business ID
    INSERT INTO accounts (business_id, code, name, type, sub_type, description, is_system, is_active)
    VALUES
        (target_business_id, '1000', 'Cash in Hand', 'asset', 'current_asset', 'Physical cash registers and petty cash', true, true),
        (target_business_id, '1001', 'Bank Account', 'asset', 'current_asset', 'Main commercial bank account', true, true),
        (target_business_id, '1100', 'Accounts Receivable', 'asset', 'current_asset', 'Pending payments due from customers', true, true),
        (target_business_id, '1200', 'Inventory - Equipment', 'asset', 'fixed_asset', 'Catering equipment, furniture, stage props', true, true),
        (target_business_id, '1300', 'Vehicles', 'asset', 'fixed_asset', 'Delivery vans and transport vehicles', true, true),
        (target_business_id, '2000', 'Accounts Payable', 'liability', 'current_liability', 'Outstanding bills owed to suppliers/vendors', true, true),
        (target_business_id, '2100', 'Loans Payable', 'liability', 'long_term_liability', 'Bank or personal business loans', true, true),
        (target_business_id, '2200', 'Advance Received', 'liability', 'current_liability', 'Advance booking deposits received from customers', true, true),
        (target_business_id, '3000', 'Owner Equity', 'equity', 'equity', 'Capital invested by business owner', true, true),
        (target_business_id, '3100', 'Retained Earnings', 'equity', 'equity', 'Accumulated profit or loss kept in business', true, true),
        (target_business_id, '4000', 'Hall Rental Income', 'income', 'revenue', 'Revenue generated from RSM and JTS hall rentals', true, true),
        (target_business_id, '4100', 'Catering Income', 'income', 'revenue', 'Food and beverage package revenue', true, true),
        (target_business_id, '4200', 'Services Income', 'income', 'revenue', 'Additional services like sound, stage, lighting, decor', true, true),
        (target_business_id, '5000', 'Catering Expenses', 'expense', 'cost_of_sales', 'Direct food ingredients, meat, cooking supplies', true, true),
        (target_business_id, '5100', 'Staff Wages', 'expense', 'overhead', 'Daily waiter, chef, and permanent staff salaries', true, true),
        (target_business_id, '5200', 'Utilities', 'expense', 'overhead', 'Electricity, generator fuel, water, and gas bills', true, true),
        (target_business_id, '5300', 'Maintenance', 'expense', 'overhead', 'Hall repairs, AC maintenance, painting', true, true),
        (target_business_id, '5400', 'Marketing', 'expense', 'overhead', 'Flex printing, social media ads, promos', true, true),
        (target_business_id, '5500', 'Vendor Payments', 'expense', 'overhead', 'Payments to third-party decorators, florists, DJs', true, true),
        (target_business_id, '5600', 'Miscellaneous Expenses', 'expense', 'overhead', 'Other small operational costs', true, true)
    ON CONFLICT (business_id, code) DO NOTHING;
END $$;