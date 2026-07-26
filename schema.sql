DROP TABLE IF EXISTS log_wa_tagihan, riwayat_generate_tagihan, audit_log, alokasi_pembayaran, pembayaran, tagihan, promo_penyewa, promo, kontrak_sewa, penyewa, unit, users CASCADE;
-- SEWAIN Application Database Schema (FINAL)
-- Prepared for Supabase / PostgreSQL
-- This script is idempotent (can be run multiple times)

BEGIN;

-- =================================================================================
-- 0. CUSTOM TYPES & ENUMS
-- =================================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_diskon_type') THEN
        CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_status_type') THEN
        CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tagihan_type') THEN
        CREATE TYPE status_tagihan_type AS ENUM ('Belum Bayar', 'Sebagian', 'Lunas', 'Terlambat', 'Write Off', 'Dibatalkan');
    ELSE
        -- Ensure all values exist in existing type
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Terlambat';
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Write Off';
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Dibatalkan';
    END IF;
END $$;

-- =================================================================================
-- 1. CORE TABLES
-- =================================================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Admin', 'Kasir', 'System Owner')) NOT NULL,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
COMMENT ON TABLE users IS 'Data pengguna sistem (Owner, Admin, System Owner)';

-- Unit
CREATE TABLE IF NOT EXISTS unit (
    id_unit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unit TEXT UNIQUE NOT NULL,
    kategori TEXT NOT NULL,
    jenis_unit TEXT NOT NULL,
    nomor_unit TEXT NOT NULL,
    harga_sewa NUMERIC(15,2) NOT NULL DEFAULT 0,
    status_unit TEXT DEFAULT 'Kosong',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
COMMENT ON TABLE unit IS 'Data unit properti yang disewakan';

-- Penyewa
CREATE TABLE IF NOT EXISTS penyewa (
    id_penyewa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    nik TEXT NOT NULL,
    alamat TEXT,
    email TEXT,
    whatsapp TEXT NOT NULL,
    kontak_darurat TEXT NOT NULL,
    jenis_usaha TEXT,
    saldo_titipan NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
COMMENT ON COLUMN penyewa.saldo_titipan IS 'Kredit/Deposit yang dimiliki penyewa hasil dari overpayment';

-- Kontrak Sewa
CREATE TABLE IF NOT EXISTS kontrak_sewa (
    id_kontrak UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kontrak TEXT UNIQUE NOT NULL,
    id_unit UUID REFERENCES unit(id_unit) ON DELETE RESTRICT,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    tanggal_masuk DATE NOT NULL,
    tanggal_keluar DATE,
    tanggal_jatuh_tempo INT NOT NULL, -- Hari dalam bulan (1-31)
    status_kontrak TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================================
-- 2. PROMO & DISKON
-- =================================================================================

-- Promo
CREATE TABLE IF NOT EXISTS promo (
    id_promo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_promo TEXT NOT NULL,
    jenis_diskon jenis_diskon_type NOT NULL,
    nilai_diskon NUMERIC(15,2) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status promo_status_type DEFAULT 'Aktif',
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_persen_limit CHECK ((jenis_diskon = 'Persen' AND nilai_diskon <= 100) OR (jenis_diskon != 'Persen'))
);

-- Promo Penyewa
CREATE TABLE IF NOT EXISTS promo_penyewa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_promo UUID REFERENCES promo(id_promo) ON DELETE CASCADE,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (id_promo, id_penyewa)
);

-- =================================================================================
-- 3. MODUL TAGIHAN (PIUTANG) & PEMBAYARAN
-- =================================================================================

-- Tagihan (Snapshot Keuangan Bulanan)
CREATE TABLE IF NOT EXISTS tagihan (
    id_tagihan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE CASCADE,
    periode TEXT NOT NULL, -- 'MM-YYYY'
    jatuh_tempo DATE NOT NULL,
    nominal_tagihan NUMERIC(15,2) NOT NULL,
    id_promo UUID REFERENCES promo(id_promo) ON DELETE SET NULL,
    nominal_diskon NUMERIC(15,2) DEFAULT 0,
    total_tagihan NUMERIC(15,2) NOT NULL,
    terbayar NUMERIC(15,2) DEFAULT 0,
    status_tagihan status_tagihan_type DEFAULT 'Belum Bayar',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(id_kontrak, periode)
);
COMMENT ON COLUMN tagihan.nominal_tagihan IS 'Harga sewa normal saat tagihan digenerate (snapshot)';

-- Pembayaran (Uang Masuk)
CREATE TABLE IF NOT EXISTS pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE SET NULL,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE SET NULL,
    periode TEXT NOT NULL, -- Periode alokasi utama
    tanggal_bayar DATE NOT NULL,
    nominal NUMERIC(15,2) NOT NULL,
    status_pembayaran TEXT DEFAULT 'Lunas',
    metode_pembayaran TEXT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alokasi Pembayaran (Link FIFO antara Pembayaran dan Tagihan)
CREATE TABLE IF NOT EXISTS alokasi_pembayaran (
    id_alokasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembayaran UUID REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
    id_tagihan UUID REFERENCES tagihan(id_tagihan) ON DELETE CASCADE,
    nominal_alokasi NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================================
-- 4. LOGGING & AUDIT
-- =================================================================================

-- Audit Log (Standardized to created_at)
CREATE TABLE IF NOT EXISTS audit_log (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    aktivitas TEXT NOT NULL,
    nama_tabel TEXT NOT NULL,
    id_data TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB
);

-- Riwayat Generate Tagihan
CREATE TABLE IF NOT EXISTS riwayat_generate_tagihan (
    id_generate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL, -- 'MM-YYYY'
    tanggal_generate TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    jumlah_tagihan INTEGER DEFAULT 0,
    total_nominal NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Selesai'
);

-- WhatsApp Reminder Log
CREATE TABLE IF NOT EXISTS log_wa_tagihan (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    tanggal_kirim TIMESTAMP WITH TIME ZONE DEFAULT now(),
    jumlah_tagihan_dilampirkan INTEGER,
    total_piutang_wa NUMERIC(15,2),
    status_kirim TEXT DEFAULT 'Berhasil',
    pesan_error TEXT
);

-- =================================================================================
-- 5. INDEXES (Performance)
-- =================================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_unit_kode ON unit(kode_unit);
CREATE INDEX IF NOT EXISTS idx_kontrak_unit ON kontrak_sewa(id_unit);
CREATE INDEX IF NOT EXISTS idx_kontrak_penyewa ON kontrak_sewa(id_penyewa);
CREATE INDEX IF NOT EXISTS idx_promo_status ON promo(status);
CREATE INDEX IF NOT EXISTS idx_promo_tanggal ON promo(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_tagihan_kontrak ON tagihan(id_kontrak);
CREATE INDEX IF NOT EXISTS idx_tagihan_periode ON tagihan(periode);
CREATE INDEX IF NOT EXISTS idx_tagihan_status ON tagihan(status_tagihan);
CREATE INDEX IF NOT EXISTS idx_pembayaran_penyewa ON pembayaran(id_penyewa);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal ON pembayaran(tanggal_bayar);
CREATE INDEX IF NOT EXISTS idx_alokasi_pembayaran ON alokasi_pembayaran(id_pembayaran);
CREATE INDEX IF NOT EXISTS idx_alokasi_tagihan ON alokasi_pembayaran(id_tagihan);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(id_user);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_wa_penyewa ON log_wa_tagihan(id_penyewa);

-- =================================================================================
-- 6. RPC FUNCTIONS (CORE LOGIC & TRANSACTIONS)
-- =================================================================================

-- 6.1 Function: Generate Tagihan Periode (Idempotent, Transactional)
CREATE OR REPLACE FUNCTION generate_tagihan_periode(p_periode TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
    v_total NUMERIC(15,2) := 0;
    v_kontrak RECORD;
    v_id_tagihan UUID;
    v_nominal_tagihan NUMERIC(15,2);
    v_id_promo UUID;
    v_nilai_diskon NUMERIC(15,2);
    v_jenis_diskon jenis_diskon_type;
    v_nominal_diskon NUMERIC(15,2);
    v_total_tagihan NUMERIC(15,2);
    v_jatuh_tempo DATE;
    v_bulan INTEGER;
    v_tahun INTEGER;
    v_saldo_penyewa NUMERIC(15,2);
    v_alokasi_deposit NUMERIC(15,2);
    v_id_pembayaran UUID;
BEGIN
    -- 1. Validate period format MM-YYYY
    IF p_periode !~ '^[0-9]{2}-[0-9]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Format periode harus MM-YYYY');
    END IF;

    -- 2. Check if already generated (skip check to allow partial regeneration of missing bills)
    -- But we will record the main execution in history

    v_bulan := split_part(p_periode, '-', 1)::INTEGER;
    v_tahun := split_part(p_periode, '-', 2)::INTEGER;

    -- 3. Loop active contracts
    FOR v_kontrak IN 
        SELECT k.*, u.harga_sewa
        FROM kontrak_sewa k
        JOIN unit u ON k.id_unit = u.id_unit
        WHERE k.status_kontrak = 'Aktif'
    LOOP
        -- Skip if bill already exists for this contract and period
        IF EXISTS (SELECT 1 FROM tagihan WHERE id_kontrak = v_kontrak.id_kontrak AND periode = p_periode) THEN
            CONTINUE;
        END IF;

        v_nominal_tagihan := v_kontrak.harga_sewa;
        
        -- Logic to handle date overflow
        BEGIN
            v_jatuh_tempo := make_date(v_tahun, v_bulan, LEAST(v_kontrak.tanggal_jatuh_tempo, 28));
        EXCEPTION WHEN OTHERS THEN
            v_jatuh_tempo := (date_trunc('month', make_date(v_tahun, v_bulan, 1)) + interval '1 month' - interval '1 day')::DATE;
        END;

        -- Apply Promo
        SELECT pr.id_promo, pr.nilai_diskon, pr.jenis_diskon 
        INTO v_id_promo, v_nilai_diskon, v_jenis_diskon
        FROM promo pr
        JOIN promo_penyewa pp ON pr.id_promo = pp.id_promo
        WHERE pp.id_penyewa = v_kontrak.id_penyewa
        AND pr.status = 'Aktif'
        AND v_jatuh_tempo BETWEEN pr.tanggal_mulai AND pr.tanggal_selesai
        LIMIT 1;

        IF v_id_promo IS NOT NULL THEN
            IF v_jenis_diskon = 'Persen' THEN
                v_nominal_diskon := v_nominal_tagihan * (v_nilai_diskon / 100);
            ELSE
                v_nominal_diskon := v_nilai_diskon;
            END IF;
        ELSE
            v_nominal_diskon := 0;
        END IF;

        v_total_tagihan := GREATEST(v_nominal_tagihan - v_nominal_diskon, 0);

        -- Insert Tagihan
        INSERT INTO tagihan (
            id_kontrak, periode, jatuh_tempo, nominal_tagihan, 
            id_promo, nominal_diskon, total_tagihan, status_tagihan
        ) VALUES (
            v_kontrak.id_kontrak, p_periode, v_jatuh_tempo, v_nominal_tagihan,
            v_id_promo, v_nominal_diskon, v_total_tagihan, 'Belum Bayar'
        ) RETURNING id_tagihan INTO v_id_tagihan;

        v_count := v_count + 1;
        v_total := v_total + v_total_tagihan;

    -- 1. Lock penyewa to prevent concurrent payment issues
        SELECT saldo_titipan INTO v_saldo_penyewa 
        FROM penyewa p
        WHERE p.id_penyewa = v_kontrak.id_penyewa 
        FOR UPDATE;
        
        IF v_saldo_penyewa > 0 AND v_total_tagihan > 0 THEN
            v_alokasi_deposit := LEAST(v_saldo_penyewa, v_total_tagihan);
            
            -- Record payment from deposit
            INSERT INTO pembayaran (
                id_kontrak, id_penyewa, periode, tanggal_bayar, 
                nominal, status_pembayaran, metode_pembayaran, catatan
            ) VALUES (
                v_kontrak.id_kontrak, v_kontrak.id_penyewa, p_periode, CURRENT_DATE,
                v_alokasi_deposit, 'Lunas', 'Saldo Titipan', 'Alokasi otomatis dari deposit saat generate tagihan'
            ) RETURNING id_pembayaran INTO v_id_pembayaran;

            -- Allocation
            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (v_id_pembayaran, v_id_tagihan, v_alokasi_deposit);

            -- Update Tagihan state
            UPDATE tagihan SET 
                terbayar = v_alokasi_deposit,
                status_tagihan = CASE WHEN v_alokasi_deposit >= v_total_tagihan THEN 'Lunas' ELSE 'Sebagian' END
            WHERE id_tagihan = v_id_tagihan;

            -- Deduct from penyewa's deposit
            UPDATE penyewa p SET saldo_titipan = p.saldo_titipan - v_alokasi_deposit WHERE p.id_penyewa = v_kontrak.id_penyewa;
        END IF;
    END LOOP;

    -- 5. Record final result in history
    INSERT INTO riwayat_generate_tagihan (periode, id_user, jumlah_tagihan, total_nominal, status)
    VALUES (p_periode, p_user_id, v_count, v_total, 'Selesai');

    RETURN jsonb_build_object('success', true, 'count', v_count, 'total', v_total);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION generate_tagihan_periode(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_tagihan_periode(TEXT, UUID) TO authenticated;


-- 6.2 Function: Proses Pembayaran FIFO (Transaction, Concurrency Safe)
CREATE OR REPLACE FUNCTION proses_pembayaran_fifo(
    p_id_penyewa UUID,
    p_id_kontrak UUID,
    p_periode TEXT,
    p_tanggal_bayar DATE,
    p_nominal NUMERIC,
    p_metode_pembayaran TEXT,
    p_id_user UUID,
    p_catatan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_pool NUMERIC(15,2);
    v_initial_deposit NUMERIC(15,2);
    v_id_pembayaran UUID;
    v_tagihan RECORD;
    v_alokasi NUMERIC(15,2);
    v_sisa_tagihan NUMERIC(15,2);
    v_user_role TEXT;
BEGIN
    -- 1. Lock penyewa to prevent concurrent payment issues
    SELECT saldo_titipan INTO v_initial_deposit FROM penyewa p WHERE p.id_penyewa = p_id_penyewa FOR UPDATE;
    
    -- Total money available = current payment + existing deposit
    v_pool := p_nominal + v_initial_deposit;

    IF v_pool <= 0 AND p_nominal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nominal pembayaran tidak valid');
    END IF;

    -- 2. Insert main payment record
    INSERT INTO pembayaran (
        id_kontrak, id_penyewa, periode, tanggal_bayar, 
        nominal, status_pembayaran, metode_pembayaran, catatan
    ) VALUES (
        p_id_kontrak, p_id_penyewa, p_periode, p_tanggal_bayar,
        p_nominal, 'Lunas', p_metode_pembayaran, p_catatan
    ) RETURNING id_pembayaran INTO v_id_pembayaran;

    -- 3. FIFO Allocation loop
    FOR v_tagihan IN 
        SELECT t.* 
        FROM tagihan t
        JOIN kontrak_sewa k ON t.id_kontrak = k.id_kontrak
        WHERE k.id_penyewa = p_id_penyewa
        AND t.status_tagihan NOT IN ('Lunas', 'Dibatalkan', 'Write Off')
        ORDER BY t.jatuh_tempo ASC
        FOR UPDATE -- Lock each bill row
    LOOP
        IF v_pool <= 0 THEN
            EXIT;
        END IF;

        v_sisa_tagihan := v_tagihan.total_tagihan - v_tagihan.terbayar;
        v_alokasi := LEAST(v_pool, v_sisa_tagihan);

        IF v_alokasi > 0 THEN
            -- Link payment to bill
            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (v_id_pembayaran, v_tagihan.id_tagihan, v_alokasi);

            -- Update bill totals and status
            UPDATE tagihan t SET 
                terbayar = t.terbayar + v_alokasi,
                status_tagihan = CASE 
                    WHEN (t.terbayar + v_alokasi) >= t.total_tagihan THEN 'Lunas'::status_tagihan_type 
                    ELSE 'Sebagian'::status_tagihan_type 
                END,
                updated_at = now()
            WHERE t.id_tagihan = v_tagihan.id_tagihan;

            v_pool := v_pool - v_alokasi;
        END IF;
    END LOOP;

    -- 4. Update the tenant's deposit with whatever is left
    UPDATE penyewa p SET saldo_titipan = v_pool WHERE p.id_penyewa = p_id_penyewa;

    -- 5. Logging
    SELECT role INTO v_user_role FROM users WHERE id = p_id_user;
    INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_baru)
    VALUES (p_id_user, COALESCE(v_user_role, 'System'), 'Pembayaran FIFO', 'pembayaran', v_id_pembayaran::TEXT, 
            jsonb_build_object(
                'pembayaran_id', v_id_pembayaran,
                'nominal_bayar', p_nominal,
                'saldo_awal', v_initial_deposit,
                'saldo_akhir', v_pool,
                'alokasi_total', (p_nominal + v_initial_deposit - v_pool)
            ));

    RETURN jsonb_build_object(
        'success', true, 
        'id_pembayaran', v_id_pembayaran, 
        'nominal_terpotong', (p_nominal + v_initial_deposit - v_pool),
        'sisa_saldo_titipan', v_pool
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION proses_pembayaran_fifo(UUID, UUID, TEXT, DATE, NUMERIC, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION proses_pembayaran_fifo(UUID, UUID, TEXT, DATE, NUMERIC, TEXT, UUID, TEXT) TO authenticated;


-- 6.3 Function: Write Off Tagihan (Transactional)
CREATE OR REPLACE FUNCTION write_off_tagihan(p_id_tagihan UUID, p_id_user UUID, p_catatan TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_old_status status_tagihan_type;
    v_user_role TEXT;
BEGIN
    SELECT t.status_tagihan INTO v_old_status FROM tagihan t WHERE t.id_tagihan = p_id_tagihan FOR UPDATE;
    
    IF v_old_status = 'Lunas' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tagihan yang sudah lunas tidak dapat di-write off');
    END IF;

    UPDATE tagihan t SET 
        status_tagihan = 'Write Off',
        catatan = COALESCE(t.catatan, '') || E'\nWrite Off: ' || p_catatan,
        updated_at = now()
    WHERE t.id_tagihan = p_id_tagihan;

    SELECT role INTO v_user_role FROM users WHERE id = p_id_user;
    INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_lama, data_baru)
    VALUES (p_id_user, COALESCE(v_user_role, 'System'), 'Write Off Tagihan', 'tagihan', p_id_tagihan::TEXT, 
            jsonb_build_object('status', v_old_status), 
            jsonb_build_object('status', 'Write Off', 'catatan', p_catatan));

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
REVOKE ALL ON FUNCTION write_off_tagihan(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION write_off_tagihan(UUID, UUID, TEXT) TO authenticated;


-- =================================================================================
-- 7. TRIGGERS (Updated At)
-- =================================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = public;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_promo') THEN
        CREATE TRIGGER set_updated_at_promo BEFORE UPDATE ON promo FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tagihan') THEN
        CREATE TRIGGER set_updated_at_tagihan BEFORE UPDATE ON tagihan FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- =================================================================================
-- =================================================================================
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
