-- =================================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =================================================================================
BEGIN;

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_auth_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_system_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() = 'System Owner';
$$;
REVOKE EXECUTE ON FUNCTION public.is_system_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_system_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() = 'Owner';
$$;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() IN ('Kasir', 'Admin');
$$;
REVOKE EXECUTE ON FUNCTION public.is_kasir() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_kasir() TO authenticated;

CREATE OR REPLACE FUNCTION public.has_operational_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() IN ('System Owner', 'Owner', 'Kasir', 'Admin');
$$;
REVOKE EXECUTE ON FUNCTION public.has_operational_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_operational_access() TO authenticated;

-- -----------------------------------------------------------------------------
-- ENABLE AND FORCE RLS ON ALL TABLES
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'users', 'unit', 'penyewa', 'kontrak_sewa', 'promo', 'promo_penyewa', 
        'tagihan', 'pembayaran', 'alokasi_pembayaran', 'audit_log', 
        'log_wa_tagihan', 'riwayat_generate_tagihan'
    ])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- DROP ALL EXISTING POLICIES (Idempotent)
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
    p text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p, t);
        END LOOP;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
-- Everyone can read users (so foreign keys and UI can display names)
CREATE POLICY "Users SELECT" ON users FOR SELECT TO authenticated USING (true);

-- System Owner can do everything
CREATE POLICY "Users INSERT System Owner" ON users FOR INSERT TO authenticated WITH CHECK (public.is_system_owner());
CREATE POLICY "Users UPDATE System Owner" ON users FOR UPDATE TO authenticated USING (public.is_system_owner()) WITH CHECK (public.is_system_owner());
CREATE POLICY "Users DELETE System Owner" ON users FOR DELETE TO authenticated USING (public.is_system_owner());

-- Owner can manage Kasir and other Owners, but cannot touch System Owner
CREATE POLICY "Users INSERT Owner" ON users FOR INSERT TO authenticated
WITH CHECK (public.is_owner() AND role != 'System Owner');

CREATE POLICY "Users UPDATE Owner" ON users FOR UPDATE TO authenticated
USING (public.is_owner() AND role != 'System Owner')
WITH CHECK (role != 'System Owner');

CREATE POLICY "Users DELETE Owner" ON users FOR DELETE TO authenticated
USING (public.is_owner() AND role != 'System Owner');

-- -----------------------------------------------------------------------------
-- OPERATIONAL TABLES (CRUD ALL for System Owner, Owner, and Kasir)
-- unit, penyewa, kontrak_sewa, promo, promo_penyewa, pembayaran, alokasi_pembayaran
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['unit', 'penyewa', 'kontrak_sewa', 'promo', 'promo_penyewa', 'pembayaran', 'alokasi_pembayaran'])
    LOOP
        EXECUTE format('CREATE POLICY "%s SELECT" ON %I FOR SELECT TO authenticated USING (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s INSERT" ON %I FOR INSERT TO authenticated WITH CHECK (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s UPDATE" ON %I FOR UPDATE TO authenticated USING (public.has_operational_access()) WITH CHECK (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s DELETE" ON %I FOR DELETE TO authenticated USING (public.has_operational_access())', t, t);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- TAGIHAN TABLE POLICIES (Kasir cannot Write Off, cannot Delete)
-- -----------------------------------------------------------------------------
CREATE POLICY "tagihan SELECT" ON tagihan FOR SELECT TO authenticated USING (public.has_operational_access());

-- System Owner & Owner can CRUD all tagihan
CREATE POLICY "tagihan INSERT SO Owner" ON tagihan FOR INSERT TO authenticated WITH CHECK (public.is_system_owner() OR public.is_owner());
CREATE POLICY "tagihan UPDATE SO Owner" ON tagihan FOR UPDATE TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner());
CREATE POLICY "tagihan DELETE SO Owner" ON tagihan FOR DELETE TO authenticated USING (public.is_system_owner() OR public.is_owner());

-- Kasir can Read, Insert, Update tagihan, but cannot use 'Write Off' status, and CANNOT Delete
CREATE POLICY "tagihan INSERT Kasir" ON tagihan FOR INSERT TO authenticated WITH CHECK (public.is_kasir() AND status_tagihan != 'Write Off');
CREATE POLICY "tagihan UPDATE Kasir" ON tagihan FOR UPDATE TO authenticated USING (public.is_kasir()) WITH CHECK (status_tagihan != 'Write Off');

-- -----------------------------------------------------------------------------
-- LOG TABLES (audit_log, log_wa_tagihan, riwayat_generate_tagihan)
-- -----------------------------------------------------------------------------
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['audit_log', 'log_wa_tagihan', 'riwayat_generate_tagihan'])
    LOOP
        -- Everyone operational can read and insert logs
        EXECUTE format('CREATE POLICY "%s SELECT" ON %I FOR SELECT TO authenticated USING (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s INSERT" ON %I FOR INSERT TO authenticated WITH CHECK (public.has_operational_access())', t, t);
        
        -- System Owner and Owner can update/delete logs
        EXECUTE format('CREATE POLICY "%s UPDATE SO Owner" ON %I FOR UPDATE TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner())', t, t);
        EXECUTE format('CREATE POLICY "%s DELETE SO Owner" ON %I FOR DELETE TO authenticated USING (public.is_system_owner() OR public.is_owner())', t, t);
    END LOOP;
END $$;

COMMIT;
