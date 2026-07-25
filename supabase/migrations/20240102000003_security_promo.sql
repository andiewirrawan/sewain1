-- SQL Migration: Security Hardening for Promo Features

-- 1. Enable RLS
ALTER TABLE promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_penyewa ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (Idempotent)
DROP POLICY IF EXISTS "Promo can be viewed by authenticated users" ON promo;
DROP POLICY IF EXISTS "Promo can be managed by Owners only" ON promo;
DROP POLICY IF EXISTS "Promo assignments can be viewed by authenticated users" ON promo_penyewa;
DROP POLICY IF EXISTS "Promo assignments can be managed by Owners only" ON promo_penyewa;

-- 3. Create Security Policies
-- Promo Table
CREATE POLICY "Promo can be viewed by authenticated users" 
ON promo FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Promo can be managed by Owners only" 
ON promo FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Owner'
    )
);

-- Promo Penyewa Table
CREATE POLICY "Promo assignments can be viewed by authenticated users" 
ON promo_penyewa FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Promo assignments can be managed by Owners only" 
ON promo_penyewa FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Owner'
    )
);
