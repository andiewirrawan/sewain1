-- =================================================================================
-- SEWAIN Application Complete Database Setup
-- PostgreSQL / Supabase SQL Editor Compatible
-- =================================================================================

-- 0. INITIALIZATION & CLEAN SLATE
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS log_wa_tagihan, riwayat_generate_tagihan, audit_log, alokasi_pembayaran, pembayaran, tagihan, promo_penyewa, promo, kontrak_sewa, penyewa, unit, users, pengaturan_aplikasi CASCADE;
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
    role TEXT CHECK (role IN ('Owner', 'Admin', 'System Owner')) NOT NULL,
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
    prioritas INTEGER DEFAULT 0,
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

-- 6. PENGATURAN APLIKASI
CREATE TABLE pengaturan_aplikasi (
    id INT PRIMARY KEY DEFAULT 1,
    nama_usaha TEXT,
    whatsapp_admin TEXT,
    mata_uang TEXT DEFAULT 'IDR',
    zona_waktu TEXT DEFAULT 'Asia/Jakarta',
    versi_aplikasi TEXT,
    versi_schema TEXT,
    build_terakhir TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 7. INDEXES
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

-- 8. FUNCTIONS & TRIGGERS

-- Updated At Function
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
CREATE TRIGGER set_updated_at_pengaturan BEFORE UPDATE ON pengaturan_aplikasi FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

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
        ORDER BY pr.prioritas DESC
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
            id_kontrak, periode, jatuh_tempo, nominal_tagihan, 
            id_promo, nominal_diskon, total_tagihan, status_tagihan
        ) VALUES (
            v_kontrak.id_kontrak, p_periode, v_jatuh_tempo, v_nominal_tagihan,
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
                id_kontrak, id_penyewa, periode, tanggal_bayar, 
                nominal, status_pembayaran, metode_pembayaran, catatan
            ) VALUES (
                v_kontrak.id_kontrak, v_kontrak.id_penyewa, p_periode, CURRENT_DATE,
                v_alokasi_deposit, 'Lunas', 'Saldo Titipan', 'Alokasi otomatis dari deposit saat generate tagihan'
            ) RETURNING id_pembayaran INTO v_id_pembayaran;

            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (v_id_pembayaran, v_id_tagihan, v_alokasi_deposit);

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
        id_kontrak, id_penyewa, periode, tanggal_bayar, 
        nominal, status_pembayaran, metode_pembayaran, catatan
    ) VALUES (
        p_id_kontrak, p_id_penyewa, p_periode, p_tanggal_bayar,
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
            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (v_id_pembayaran, v_tagihan.id_tagihan, v_alokasi);
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

-- 9. ROW LEVEL SECURITY (RLS)
BEGIN;

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

CREATE OR REPLACE FUNCTION public.has_operational_access()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_auth_user_role() IN ('System Owner', 'Owner', 'Admin');
$$;
REVOKE EXECUTE ON FUNCTION public.has_operational_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_operational_access() TO authenticated;

-- Enable RLS on all tables
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'users', 'unit', 'penyewa', 'kontrak_sewa', 'promo', 'promo_penyewa', 
        'tagihan', 'pembayaran', 'alokasi_pembayaran', 'audit_log', 
        'log_wa_tagihan', 'riwayat_generate_tagihan', 'pengaturan_aplikasi'
    ])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Drop all existing policies
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

-- USERS Table Policies
CREATE POLICY "Users SELECT" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users ALL System Owner" ON users FOR ALL TO authenticated USING (public.is_system_owner());
CREATE POLICY "Users INSERT Owner" ON users FOR INSERT TO authenticated WITH CHECK (public.is_owner() AND role != 'System Owner');
CREATE POLICY "Users UPDATE Owner" ON users FOR UPDATE TO authenticated USING (public.is_owner() AND role != 'System Owner') WITH CHECK (role != 'System Owner');
CREATE POLICY "Users DELETE Owner" ON users FOR DELETE TO authenticated USING (public.is_owner() AND role != 'System Owner');

-- OPERATIONAL Tables Policies
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

-- TAGIHAN Table Policies
CREATE POLICY "tagihan SELECT" ON tagihan FOR SELECT TO authenticated USING (public.has_operational_access());
CREATE POLICY "tagihan ALL SO Owner" ON tagihan FOR ALL TO authenticated USING (public.is_system_owner() OR public.is_owner());
CREATE POLICY "tagihan INSERT Admin" ON tagihan FOR INSERT TO authenticated WITH CHECK (public.get_auth_user_role() = 'Admin' AND status_tagihan != 'Write Off');
CREATE POLICY "tagihan UPDATE Admin" ON tagihan FOR UPDATE TO authenticated USING (public.get_auth_user_role() = 'Admin') WITH CHECK (status_tagihan != 'Write Off');

-- LOG TABLES Policies
DO $$ DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['audit_log', 'log_wa_tagihan', 'riwayat_generate_tagihan'])
    LOOP
        EXECUTE format('CREATE POLICY "%s SELECT" ON %I FOR SELECT TO authenticated USING (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s INSERT" ON %I FOR INSERT TO authenticated WITH CHECK (public.has_operational_access())', t, t);
        EXECUTE format('CREATE POLICY "%s UPDATE SO Owner" ON %I FOR UPDATE TO authenticated USING (public.is_system_owner() OR public.is_owner()) WITH CHECK (public.is_system_owner() OR public.is_owner())', t, t);
        EXECUTE format('CREATE POLICY "%s DELETE SO Owner" ON %I FOR DELETE TO authenticated USING (public.is_system_owner() OR public.is_owner())', t, t);
    END LOOP;
END $$;

-- PENGATURAN APLIKASI Policies
CREATE POLICY "pengaturan SELECT" ON pengaturan_aplikasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "pengaturan UPDATE" ON pengaturan_aplikasi FOR UPDATE TO authenticated USING (public.is_owner() OR public.is_system_owner());

COMMIT;

-- 10. SEED DATA

BEGIN;

-- Initial Settings
INSERT INTO pengaturan_aplikasi (id, nama_usaha, versi_aplikasi, versi_schema)
VALUES (1, 'Pujasera & Kos Pelangi', '1.0.0', 'v7')
ON CONFLICT (id) DO NOTHING;

-- Initial Users (Passwords are 'password123' hashed)
INSERT INTO users (id, nama, email, password, role, is_system_owner) VALUES
('11111111-1111-1111-1111-111111111111', 'System Manager', 'system@sewain.com', '$2b$10$W1.R6kC6nE/eY6W7Z7RzEuWj7m5G7X7oJ4oZ1j3mF6G7n6v.i.K3W', 'System Owner', true),
('caf7d1dd-46f1-48c3-9807-c2662360af9e', 'Rita Syalalla', 'ritasyalalla@gmail.com', '$2b$10$W1.R6kC6nE/eY6W7Z7RzEuWj7m5G7X7oJ4oZ1j3mF6G7n6v.i.K3W', 'Owner', false),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin Operasional', 'admin@sewain.com', '$2b$10$W1.R6kC6nE/eY6W7Z7RzEuWj7m5G7X7oJ4oZ1j3mF6G7n6v.i.K3W', 'Admin', false);

-- PROMO DATA
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi, prioritas) VALUES
('f1000000-0000-4000-a000-000000000001', 'Early Bird 2026', 'Persen', 10.00, '2026-01-01', '2026-03-31', 'Aktif', 'Diskon 10% untuk penyewa yang masuk di Q1.', 10),
('f1000000-0000-4000-a000-000000000002', 'Ramadan Kareem', 'Nominal', 200000.00, '2026-03-01', '2026-04-30', 'Tidak Aktif', 'Potongan 200rb selama bulan Ramadan.', 5),
('f1000000-0000-4000-a000-000000000003', 'Mid Year Sale', 'Nominal', 500000.00, '2026-06-01', '2026-08-31', 'Aktif', 'Potongan 500rb untuk sewa minimal 6 bulan.', 20);

-- UNIT DATA
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit) VALUES
('f2000000-0000-4000-a000-000000000001', 'R-01', 'Ruko', 'A', '01', 5000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000002', 'R-02', 'Ruko', 'A', '02', 5000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000003', 'R-03', 'Ruko', 'B', '03', 6500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000004', 'K-01', 'Kios', 'Small', '01', 1500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000005', 'K-02', 'Kios', 'Small', '02', 1500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000006', 'K-03', 'Kios', 'Large', '03', 2500000.00, 'Kosong'),
('f2000000-0000-4000-a000-000000000007', 'K-04', 'Kios', 'Large', '04', 2500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000008', 'T-01', 'Kost', 'VIP', '101', 3500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000009', 'T-02', 'Kost', 'VIP', '102', 3500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000010', 'T-03', 'Kost', 'Standard', '201', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000011', 'T-04', 'Kost', 'Standard', '202', 1200000.00, 'Kosong'),
('f2000000-0000-4000-a000-000000000012', 'T-05', 'Kost', 'Standard', '203', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000013', 'T-06', 'Kost', 'Standard', '204', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000014', 'O-01', 'Office', 'Co-working', 'A1', 8000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000015', 'O-02', 'Office', 'Executive', 'B1', 12000000.00, 'Kosong');

-- PENYEWA DATA
INSERT INTO penyewa (id_penyewa, nama, nik, alamat, whatsapp, kontak_darurat, jenis_usaha) VALUES
('f3000000-0000-4000-a000-000000000001', 'Budi Santoso', '3201010101010001', 'Jakarta', '6281234567890', 'Istri - 0812', 'F&B'),
('f3000000-0000-4000-a000-000000000002', 'Ani Wijaya', '3201010101010002', 'Bandung', '6281234567891', 'Ayah - 0813', 'Retail'),
('f3000000-0000-4000-a000-000000000003', 'PT Maju Terus', '3201010101010003', 'Gedung Cyber', '6281234567892', 'Admin - 0814', 'IT'),
('f3000000-0000-4000-a000-000000000004', 'Citra Lestari', '3201010101010004', 'Depok', '6281234567893', 'Ibu - 0815', 'Kecantikan'),
('f3000000-0000-4000-a000-000000000005', 'Dedi Kurniawan', '3201010101010005', 'Bekasi', '6281234567894', 'Adik - 0816', 'Pribadi'),
('f3000000-0000-4000-a000-000000000006', 'Eka Putri', '3201010101010006', 'Bogor', '6281234567895', 'Suami - 0817', 'Pribadi'),
('f3000000-0000-4000-a000-000000000007', 'Fajar Ramadhan', '3201010101010007', 'Tangerang', '6281234567896', 'Kakak - 0818', 'Jasa'),
('f3000000-0000-4000-a000-000000000008', 'Gita Gutawa', '3201010101010008', 'Jakarta Selatan', '6281234567897', 'Manager - 0819', 'Pribadi'),
('f3000000-0000-4000-a000-000000000009', 'Hendra Setiawan', '3201010101010009', 'Cimahi', '6281234567898', 'Istri - 0820', 'Olahraga'),
('f3000000-0000-4000-a000-000000000010', 'Indah Permata', '3201010101010010', 'Surabaya', '6281234567899', 'Ibu - 0821', 'E-commerce'),
('f3000000-0000-4000-a000-000000000011', 'Joko Susilo', '3201010101010011', 'Solo', '6281234567800', 'Anak - 0822', 'Kuliner'),
('f3000000-0000-4000-a000-000000000012', 'Kiki Amelia', '3201010101010012', 'Semarang', '6281234567801', 'Sahabat - 0823', 'Fashion');

-- PROMO PENYEWA
INSERT INTO promo_penyewa (id_promo, id_penyewa) VALUES
('f1000000-0000-4000-a000-000000000001', 'f3000000-0000-4000-a000-000000000001'),
('f1000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000009');

-- KONTRAK SEWA
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_keluar, tanggal_jatuh_tempo, status_kontrak) VALUES
('f4000000-0000-4000-a000-000000000001', 'KTR-2026-001', 'f2000000-0000-4000-a000-000000000001', 'f3000000-0000-4000-a000-000000000001', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000002', 'KTR-2026-002', 'f2000000-0000-4000-a000-000000000002', 'f3000000-0000-4000-a000-000000000002', '2026-01-01', '2026-12-31', 10, 'Aktif'),
('f4000000-0000-4000-a000-000000000003', 'KTR-2026-003', 'f2000000-0000-4000-a000-000000000014', 'f3000000-0000-4000-a000-000000000003', '2026-01-01', '2026-12-31', 1, 'Aktif'),
('f4000000-0000-4000-a000-000000000004', 'KTR-2026-004', 'f2000000-0000-4000-a000-000000000004', 'f3000000-0000-4000-a000-000000000004', '2026-02-01', '2027-01-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000005', 'KTR-2026-005', 'f2000000-0000-4000-a000-000000000008', 'f3000000-0000-4000-a000-000000000005', '2026-03-01', '2026-08-31', 15, 'Aktif'),
('f4000000-0000-4000-a000-000000000006', 'KTR-2026-006', 'f2000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000006', '2026-01-01', '2026-04-30', 5, 'Selesai'),
('f4000000-0000-4000-a000-000000000007', 'KTR-2026-007', 'f2000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000007', '2026-05-15', '2027-05-14', 20, 'Aktif'),
('f4000000-0000-4000-a000-000000000008', 'KTR-2026-008', 'f2000000-0000-4000-a000-000000000005', 'f3000000-0000-4000-a000-000000000008', '2026-04-01', '2026-10-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000009', 'KTR-2026-009', 'f2000000-0000-4000-a000-000000000007', 'f3000000-0000-4000-a000-000000000009', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000010', 'KTR-2026-010', 'f2000000-0000-4000-a000-000000000009', 'f3000000-0000-4000-a000-000000000010', '2026-05-01', '2026-12-31', 10, 'Aktif'),
('f4000000-0000-4000-a000-000000000011', 'KTR-2026-011', 'f2000000-0000-4000-a000-000000000012', 'f3000000-0000-4000-a000-000000000011', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000012', 'KTR-2026-012', 'f2000000-0000-4000-a000-000000000013', 'f3000000-0000-4000-a000-000000000012', '2026-06-01', '2027-05-31', 10, 'Aktif');

-- SIMULATED TRANSACTIONS (Jan - July)
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001', '01-2026', '2026-01-05', 5000000, 5000000, 5000000, 'Lunas'),
('f5000000-0000-4000-a000-000000000003', 'f4000000-0000-4000-a000-000000000003', '01-2026', '2026-01-01', 8000000, 8000000, 8000000, 'Lunas');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001', 'f3000000-0000-4000-a000-000000000001', '01-2026', '2026-01-04', 5000000, 'Transfer BCA'),
('f6000000-0000-4000-a000-000000000003', 'f4000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000003', '01-2026', '2025-12-30', 8000000, 'Transfer Mandiri');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000001', 'f5000000-0000-4000-a000-000000000001', 5000000),
('f6000000-0000-4000-a000-000000000003', 'f5000000-0000-4000-a000-000000000003', 8000000);

-- AUDIT LOGS
INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_baru) VALUES
('11111111-1111-1111-1111-111111111111', 'System Owner', 'Setup Master Data Units', 'unit', 'ALL', '{"count": 15}'),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin', 'Create New Contract KTR-2026-001', 'kontrak_sewa', 'f4000000-0000-4000-a000-000000000001', '{"status": "Aktif"}');

COMMIT;
