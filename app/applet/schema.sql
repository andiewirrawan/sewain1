-- =================================================================================
-- SEWAIN Application Database Schema (Complete & Fixed)
-- =================================================================================

-- 0. INITIALIZATION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean Slate (Careful order for CASCADE)
DROP TABLE IF EXISTS log_wa_tagihan, riwayat_generate_tagihan, audit_log, alokasi_pembayaran, pembayaran, tagihan, promo_penyewa, promo, kontrak_sewa, penyewa, unit, users CASCADE;
DROP TYPE IF EXISTS jenis_diskon_type CASCADE;
DROP TYPE IF EXISTS promo_status_type CASCADE;
DROP TYPE IF EXISTS status_tagihan_type CASCADE;

-- 1. CUSTOM TYPES & ENUMS
CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');
CREATE TYPE status_tagihan_type AS ENUM ('Belum Bayar', 'Sebagian', 'Lunas', 'Terlambat', 'Write Off', 'Dibatalkan');

-- 2. CORE TABLES

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Admin', 'Kasir', 'System Owner')) NOT NULL,
    is_system_owner BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unit Table
CREATE TABLE unit (
    id_unit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unit TEXT UNIQUE NOT NULL,
    kategori TEXT NOT NULL,
    jenis_unit TEXT NOT NULL,
    nomor_unit TEXT NOT NULL,
    harga_sewa NUMERIC(15,2) NOT NULL DEFAULT 0,
    status_unit TEXT DEFAULT 'Kosong',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Penyewa Table
CREATE TABLE penyewa (
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

-- Kontrak Sewa Table
CREATE TABLE kontrak_sewa (
    id_kontrak UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kontrak TEXT UNIQUE NOT NULL,
    id_unit UUID REFERENCES unit(id_unit) ON DELETE RESTRICT,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    tanggal_masuk DATE NOT NULL,
    tanggal_keluar DATE,
    tanggal_jatuh_tempo INT NOT NULL, -- Day of month (1-31)
    status_kontrak TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. PROMO & DISKON

-- Promo Table
CREATE TABLE promo (
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

-- Promo Penyewa Junction
CREATE TABLE promo_penyewa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_promo UUID REFERENCES promo(id_promo) ON DELETE CASCADE,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (id_promo, id_penyewa)
);

-- 4. MODUL TAGIHAN & PEMBAYARAN

-- Tagihan Table
CREATE TABLE tagihan (
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

-- Pembayaran Table
CREATE TABLE pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE SET NULL,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE SET NULL,
    periode TEXT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    nominal NUMERIC(15,2) NOT NULL,
    status_pembayaran TEXT DEFAULT 'Lunas',
    metode_pembayaran TEXT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alokasi Pembayaran (FIFO Link)
CREATE TABLE alokasi_pembayaran (
    id_alokasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembayaran UUID REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
    id_tagihan UUID REFERENCES tagihan(id_tagihan) ON DELETE CASCADE,
    nominal_alokasi NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. LOGGING & AUDIT

-- Audit Log
CREATE TABLE audit_log (
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
CREATE TABLE riwayat_generate_tagihan (
    id_generate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL,
    tanggal_generate TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    jumlah_tagihan INTEGER DEFAULT 0,
    total_nominal NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Selesai'
);

-- WhatsApp Reminder Log
CREATE TABLE log_wa_tagihan (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    tanggal_kirim TIMESTAMP WITH TIME ZONE DEFAULT now(),
    jumlah_tagihan_dilampirkan INTEGER,
    total_piutang_wa NUMERIC(15,2),
    status_kirim TEXT DEFAULT 'Berhasil',
    pesan_error TEXT
);

-- 6. INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_unit_kode ON unit(kode_unit);
CREATE INDEX idx_kontrak_unit ON kontrak_sewa(id_unit);
CREATE INDEX idx_kontrak_penyewa ON kontrak_sewa(id_penyewa);
CREATE INDEX idx_tagihan_kontrak ON tagihan(id_kontrak);
CREATE INDEX idx_tagihan_periode ON tagihan(periode);
CREATE INDEX idx_tagihan_status ON tagihan(status_tagihan);
CREATE INDEX idx_pembayaran_penyewa ON pembayaran(id_penyewa);
CREATE INDEX idx_pembayaran_tanggal ON pembayaran(tanggal_bayar);
CREATE INDEX idx_alokasi_pembayaran ON alokasi_pembayaran(id_pembayaran);
CREATE INDEX idx_alokasi_tagihan ON alokasi_pembayaran(id_tagihan);

-- 7. FUNCTIONS

-- Function: handle_updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Updated At
CREATE TRIGGER set_updated_at_promo BEFORE UPDATE ON promo FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_tagihan BEFORE UPDATE ON tagihan FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function: generate_tagihan_periode
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
    IF p_periode !~ '^[0-9]{2}-[0-9]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Format periode harus MM-YYYY');
    END IF;

    v_bulan := split_part(p_periode, '-', 1)::INTEGER;
    v_tahun := split_part(p_periode, '-', 2)::INTEGER;

    FOR v_kontrak IN 
        SELECT k.*, u.harga_sewa
        FROM kontrak_sewa k
        JOIN unit u ON k.id_unit = u.id_unit
        WHERE k.status_kontrak = 'Aktif'
    LOOP
        IF EXISTS (SELECT 1 FROM tagihan WHERE id_kontrak = v_kontrak.id_kontrak AND periode = p_periode) THEN
            CONTINUE;
        END IF;

        v_nominal_tagihan := v_kontrak.harga_sewa;
        
        BEGIN
            v_jatuh_tempo := make_date(v_tahun, v_bulan, LEAST(v_kontrak.tanggal_jatuh_tempo, 28));
        EXCEPTION WHEN OTHERS THEN
            v_jatuh_tempo := (date_trunc('month', make_date(v_tahun, v_bulan, 1)) + interval '1 month' - interval '1 day')::DATE;
        END;

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

        INSERT INTO tagihan (
            id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, 
            id_promo, nominal_diskon, total_tagihan, status_tagihan
        ) VALUES (
            gen_random_uuid(), v_kontrak.id_kontrak, p_periode, v_jatuh_tempo, v_nominal_tagihan,
            v_id_promo, v_nominal_diskon, v_total_tagihan, 'Belum Bayar'
        ) RETURNING id_tagihan INTO v_id_tagihan;

        v_count := v_count + 1;
        v_total := v_total + v_total_tagihan;

        SELECT saldo_titipan INTO v_saldo_penyewa 
        FROM penyewa p
        WHERE p.id_penyewa = v_kontrak.id_penyewa 
        FOR UPDATE;
                
        IF v_saldo_penyewa > 0 AND v_total_tagihan > 0 THEN
            v_alokasi_deposit := LEAST(v_saldo_penyewa, v_total_tagihan);
            
            INSERT INTO pembayaran (
                id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, 
                nominal, status_pembayaran, metode_pembayaran, catatan
            ) VALUES (
                gen_random_uuid(), v_kontrak.id_kontrak, v_kontrak.id_penyewa, p_periode, CURRENT_DATE,
                v_alokasi_deposit, 'Lunas', 'Saldo Titipan', 'Alokasi otomatis dari deposit saat generate tagihan'
            ) RETURNING id_pembayaran INTO v_id_pembayaran;

            INSERT INTO alokasi_pembayaran (id_alokasi, id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (gen_random_uuid(), v_id_pembayaran, v_id_tagihan, v_alokasi_deposit);

            UPDATE tagihan SET 
                terbayar = v_alokasi_deposit,
                status_tagihan = CASE WHEN v_alokasi_deposit >= v_total_tagihan THEN 'Lunas' ELSE 'Sebagian' END
            WHERE id_tagihan = v_id_tagihan;

            UPDATE penyewa p SET saldo_titipan = p.saldo_titipan - v_alokasi_deposit WHERE p.id_penyewa = v_kontrak.id_penyewa;
        END IF;
    END LOOP;

    INSERT INTO riwayat_generate_tagihan (periode, id_user, jumlah_tagihan, total_nominal, status)
    VALUES (p_periode, p_user_id, v_count, v_total, 'Selesai');

    RETURN jsonb_build_object('success', true, 'count', v_count, 'total', v_total);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Function: proses_pembayaran_fifo
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
    SELECT saldo_titipan INTO v_initial_deposit FROM penyewa p WHERE p.id_penyewa = p_id_penyewa FOR UPDATE;
    v_pool := p_nominal + v_initial_deposit;
    
    IF v_pool <= 0 AND p_nominal <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nominal pembayaran tidak valid');
    END IF;

    INSERT INTO pembayaran (
        id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, 
        nominal, status_pembayaran, metode_pembayaran, catatan
    ) VALUES (
        gen_random_uuid(), p_id_kontrak, p_id_penyewa, p_periode, p_tanggal_bayar,
        p_nominal, 'Lunas', p_metode_pembayaran, p_catatan
    ) RETURNING id_pembayaran INTO v_id_pembayaran;

    FOR v_tagihan IN 
        SELECT t.* 
        FROM tagihan t
        JOIN kontrak_sewa k ON t.id_kontrak = k.id_kontrak
        WHERE k.id_penyewa = p_id_penyewa
        AND t.status_tagihan NOT IN ('Lunas', 'Dibatalkan', 'Write Off')
        ORDER BY t.jatuh_tempo ASC
        FOR UPDATE
    LOOP
        IF v_pool <= 0 THEN
            EXIT;
        END IF;
        v_sisa_tagihan := v_tagihan.total_tagihan - v_tagihan.terbayar;
        v_alokasi := LEAST(v_pool, v_sisa_tagihan);
        IF v_alokasi > 0 THEN
            INSERT INTO alokasi_pembayaran (id_alokasi, id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (gen_random_uuid(), v_id_pembayaran, v_tagihan.id_tagihan, v_alokasi);
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

    UPDATE penyewa p SET saldo_titipan = v_pool WHERE p.id_penyewa = p_id_penyewa;
    
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

-- Function: write_off_tagihan
CREATE OR REPLACE FUNCTION write_off_tagihan(
    p_id_tagihan UUID,
    p_id_user UUID,
    p_catatan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_tagihan RECORD;
    v_user_role TEXT;
BEGIN
    SELECT * INTO v_tagihan FROM tagihan WHERE id_tagihan = p_id_tagihan FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tagihan tidak ditemukan');
    END IF;

    IF v_tagihan.status_tagihan = 'Lunas' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Tagihan sudah lunas tidak bisa di-write off');
    END IF;

    UPDATE tagihan SET 
        status_tagihan = 'Write Off',
        catatan = COALESCE(catatan, '') || ' [Write Off by ' || p_id_user || ': ' || p_catatan || ']',
        updated_at = now()
    WHERE id_tagihan = p_id_tagihan;

    SELECT role INTO v_user_role FROM users WHERE id = p_id_user;
    
    INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_lama, data_baru)
    VALUES (p_id_user, COALESCE(v_user_role, 'System'), 'Write Off Tagihan', 'tagihan', p_id_tagihan::TEXT, 
            to_jsonb(v_tagihan), jsonb_build_object('status_tagihan', 'Write Off', 'catatan', p_catatan));

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Function: execute_sql (Internal Utility for Migrations)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ROW LEVEL SECURITY (RLS)
BEGIN;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_system_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_system_owner FROM public.users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() = 'Owner';
$$;

CREATE OR REPLACE FUNCTION public.has_operational_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() IN ('System Owner', 'Owner', 'Kasir', 'Admin');
$$;

DO $$ 
DECLARE
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

-- USERS Table Policies
CREATE POLICY "Users SELECT" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users ALL System Owner" ON users FOR ALL TO authenticated USING (public.is_system_owner());

-- OPERATIONAL Tables Policies
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['unit', 'penyewa', 'kontrak_sewa', 'promo', 'promo_penyewa', 'pembayaran', 'alokasi_pembayaran'])
    LOOP
        EXECUTE format('CREATE POLICY "%s ALL" ON %I FOR ALL TO authenticated USING (public.has_operational_access())', t, t);
    END LOOP;
END $$;

-- TAGIHAN Table Policies
CREATE POLICY "tagihan SELECT" ON tagihan FOR SELECT TO authenticated USING (public.has_operational_access());
CREATE POLICY "tagihan ALL SO Owner" ON tagihan FOR ALL TO authenticated USING (public.is_system_owner() OR public.is_owner());

COMMIT;
