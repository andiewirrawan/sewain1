-- =================================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =================================================================================
BEGIN;

-- 1. Helper Functions to get roles
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_system_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.get_auth_user_role() = 'System Owner';
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.get_auth_user_role() = 'Owner';
$$;

CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.get_auth_user_role() IN ('Kasir', 'Admin');
$$;

CREATE OR REPLACE FUNCTION public.has_operational_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.get_auth_user_role() IN ('System Owner', 'Owner', 'Kasir', 'Admin');
$$;

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontrak_sewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE alokasi_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_wa_tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_generate_tagihan ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first (just in case they were created outside the script loop)
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s access" ON %I', t, t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users SELECT" ON users;
DROP POLICY IF EXISTS "Users INSERT" ON users;
DROP POLICY IF EXISTS "Users UPDATE" ON users;
DROP POLICY IF EXISTS "Users DELETE" ON users;
DROP POLICY IF EXISTS "Users INSERT System Owner" ON users;
DROP POLICY IF EXISTS "Users UPDATE System Owner" ON users;
DROP POLICY IF EXISTS "Users DELETE System Owner" ON users;
DROP POLICY IF EXISTS "Users INSERT Owner" ON users;
DROP POLICY IF EXISTS "Users UPDATE Owner" ON users;
DROP POLICY IF EXISTS "Users DELETE Owner" ON users;

-- Everyone can read users (so foreign keys and UI can display names)
CREATE POLICY "Users SELECT" ON users FOR SELECT TO authenticated USING (true);

-- System Owner can do everything
CREATE POLICY "Users INSERT System Owner" ON users FOR INSERT TO authenticated USING (public.is_system_owner()) WITH CHECK (public.is_system_owner());
CREATE POLICY "Users UPDATE System Owner" ON users FOR UPDATE TO authenticated USING (public.is_system_owner()) WITH CHECK (public.is_system_owner());
CREATE POLICY "Users DELETE System Owner" ON users FOR DELETE TO authenticated USING (public.is_system_owner());

-- Owner can manage Kasir and other Owners, but cannot touch System Owner
CREATE POLICY "Users INSERT Owner" ON users FOR INSERT TO authenticated
USING (public.is_owner())
WITH CHECK (role != 'System Owner');

CREATE POLICY "Users UPDATE Owner" ON users FOR UPDATE TO authenticated
USING (public.is_owner() AND role != 'System Owner')
WITH CHECK (role != 'System Owner');

CREATE POLICY "Users DELETE Owner" ON users FOR DELETE TO authenticated
USING (public.is_owner() AND role != 'System Owner');

-- Kasir cannot INSERT/UPDATE/DELETE users.

-- -----------------------------------------------------------------------------
-- OPERATIONAL TABLES (CRUD ALL for System Owner, Owner, and Kasir)
-- unit, penyewa, kontrak_sewa, promo, promo_penyewa, pembayaran, alokasi_pembayaran
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['unit', 'penyewa', 'kontrak_sewa', 'promo', 'promo_penyewa', 'pembayaran', 'alokasi_pembayaran'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s SELECT" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s INSERT" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s UPDATE" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s DELETE" ON %I', t, t);
        
        EXECUTE format('CREATE POLICY "%s SELECT" ON %I FOR SELECT TO authenticated USING (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s INSERT" ON %I FOR INSERT TO authenticated USING (public.has_operational_access()) WITH CHECK (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s UPDATE" ON %I FOR UPDATE TO authenticated USING (public.has_operational_access()) WITH CHECK (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s DELETE" ON %I FOR DELETE TO authenticated USING (public.has_operational_access())', t, t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- TAGIHAN TABLE POLICIES (Kasir cannot Write Off)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tagihan SELECT" ON tagihan;
DROP POLICY IF EXISTS "tagihan INSERT" ON tagihan;
DROP POLICY IF EXISTS "tagihan UPDATE" ON tagihan;
DROP POLICY IF EXISTS "tagihan DELETE" ON tagihan;
DROP POLICY IF EXISTS "tagihan INSERT SO Owner" ON tagihan;
DROP POLICY IF EXISTS "tagihan UPDATE SO Owner" ON tagihan;
DROP POLICY IF EXISTS "tagihan DELETE SO Owner" ON tagihan;
DROP POLICY IF EXISTS "tagihan INSERT Kasir" ON tagihan;
DROP POLICY IF EXISTS "tagihan UPDATE Kasir" ON tagihan;
DROP POLICY IF EXISTS "tagihan DELETE Kasir" ON tagihan;

CREATE POLICY "tagihan SELECT" ON tagihan FOR SELECT TO authenticated USING (public.has_operational_access());

-- System Owner & Owner can CRUD all tagihan
CREATE POLICY "tagihan INSERT SO Owner" ON tagihan FOR INSERT TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner());
CREATE POLICY "tagihan UPDATE SO Owner" ON tagihan FOR UPDATE TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner());
CREATE POLICY "tagihan DELETE SO Owner" ON tagihan FOR DELETE TO authenticated USING (public.is_system_owner() OR public.is_owner());

-- Kasir can CRUD tagihan, but cannot insert or update to 'Write Off' status
CREATE POLICY "tagihan INSERT Kasir" ON tagihan FOR INSERT TO authenticated USING (public.is_kasir()) WITH CHECK (status_tagihan != 'Write Off');
CREATE POLICY "tagihan UPDATE Kasir" ON tagihan FOR UPDATE TO authenticated USING (public.is_kasir()) WITH CHECK (status_tagihan != 'Write Off');
CREATE POLICY "tagihan DELETE Kasir" ON tagihan FOR DELETE TO authenticated USING (public.is_kasir());

-- -----------------------------------------------------------------------------
-- LOG TABLES (audit_log, log_wa_tagihan, riwayat_generate_tagihan)
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['audit_log', 'log_wa_tagihan', 'riwayat_generate_tagihan'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s SELECT" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s INSERT" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s UPDATE" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s DELETE" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s UPDATE SO Owner" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "%s DELETE SO Owner" ON %I', t, t);
        
        -- Everyone operational can read and insert logs
        EXECUTE format('CREATE POLICY "%s SELECT" ON %I FOR SELECT TO authenticated USING (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s INSERT" ON %I FOR INSERT TO authenticated USING (public.has_operational_access()) WITH CHECK (public.has_operational_access())', t, t);
        
        -- System Owner and Owner can update/delete logs
        EXECUTE format('CREATE POLICY "%s UPDATE SO Owner" ON %I FOR UPDATE TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner())', t, t);
        EXECUTE format('CREATE POLICY "%s DELETE SO Owner" ON %I FOR DELETE TO authenticated USING (public.is_system_owner() OR public.is_owner())', t, t);
    END LOOP;
END $$;

COMMIT;
