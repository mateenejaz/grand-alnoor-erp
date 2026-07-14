-- ====================================================================
-- PHASE 1: ENABLE ROW LEVEL SECURITY (RLS) ON ALL 13 TABLES
-- ====================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PHASE 2: CREATE BUSINESS-ISOLATION POLICIES FOR EACH TABLE
-- ====================================================================

-- 1. BUSINESSES
CREATE POLICY "Users can access their own business data" ON businesses
    FOR ALL 
    TO authenticated
    USING (id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 2. VENUES
CREATE POLICY "Users can access their own business venues" ON venues
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 3. CUSTOMERS
CREATE POLICY "Users can access their own business customers" ON customers
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 4. BOOKINGS
CREATE POLICY "Users can access their own business bookings" ON bookings
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 5. MENU PACKAGES
CREATE POLICY "Users can access their own business menu packages" ON menu_packages
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 6. MENU ITEMS
CREATE POLICY "Users can access their own business menu items" ON menu_items
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 7. MENU PACKAGE ITEMS (Join table - checks parent package visibility)
CREATE POLICY "Users can access their own business menu package links" ON menu_package_items
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM menu_packages 
            WHERE menu_packages.id = menu_package_items.package_id
        )
    );

-- 8. QUOTATIONS
CREATE POLICY "Users can access their own business quotations" ON quotations
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 9. QUOTATION LINE ITEMS (Line items - checks parent quotation visibility)
CREATE POLICY "Users can access their own business quotation line items" ON quotation_line_items
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM quotations 
            WHERE quotations.id = quotation_line_items.quotation_id
        )
    );

-- 10. CONTRACTS
CREATE POLICY "Users can access their own business contracts" ON contracts
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 11. PAYMENTS
CREATE POLICY "Users can access their own business payments" ON payments
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 12. EXPENSES
CREATE POLICY "Users can access their own business expenses" ON expenses
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));

-- 13. USERS
CREATE POLICY "Users can access user profiles within their own business" ON users
    FOR ALL 
    TO authenticated
    USING (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()))
    WITH CHECK (business_id = (SELECT business_id FROM users WHERE auth_id = auth.uid()));