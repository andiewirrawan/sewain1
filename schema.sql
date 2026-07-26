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
    role TEXT CHECK (role IN ('Owner', 'Admin', 'System Owner')) NOT NULL,
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
    alamat TEXT, -- Ditambahkan kembali karena digunakan di API
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
-- 6. TRIGGERS (Updated At)
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
-- 7. ROW LEVEL SECURITY (RLS)
-- =================================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontrak_sewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_generate_tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE alokasi_pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_wa_tagihan ENABLE ROW LEVEL SECURITY;

-- Shared Policy: Authenticated users have access to all modules
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s access" ON %I', t, t);
        EXECUTE format('CREATE POLICY "%s access" ON %I FOR ALL TO authenticated USING (true)', t, t);
    END LOOP;
END $$;

COMMIT;
