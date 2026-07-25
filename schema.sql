-- SQL Script untuk Supabase SQL Editor

-- 0. Custom Types
CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');

-- 1. Tabel users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('Owner', 'Admin')) NOT NULL,
    status TEXT DEFAULT 'Aktif'
);

-- 2. Tabel unit
CREATE TABLE unit (
    id_unit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unit TEXT UNIQUE NOT NULL,
    kategori TEXT NOT NULL,
    jenis_unit TEXT NOT NULL,
    nomor_unit TEXT NOT NULL,
    harga_sewa NUMERIC NOT NULL,
    status_unit TEXT DEFAULT 'Kosong'
);

-- 3. Tabel penyewa
CREATE TABLE penyewa (
    id_penyewa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    nik TEXT NOT NULL,
    alamat TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    kontak_darurat TEXT NOT NULL,
    jenis_usaha TEXT
);

-- 4. Tabel kontrak_sewa
CREATE TABLE kontrak_sewa (
    id_kontrak UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kontrak TEXT UNIQUE NOT NULL,
    id_unit UUID REFERENCES unit(id_unit),
    id_penyewa UUID REFERENCES penyewa(id_penyewa),
    tanggal_masuk DATE NOT NULL,
    tanggal_keluar DATE,
    tanggal_jatuh_tempo INT NOT NULL,
    status_kontrak TEXT DEFAULT 'Aktif'
);

-- 6. Tabel promo (Dinaikkan agar bisa direferensi oleh pembayaran)
CREATE TABLE promo (
    id_promo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_promo TEXT NOT NULL,
    jenis_diskon jenis_diskon_type NOT NULL,
    nilai_diskon NUMERIC NOT NULL CHECK (nilai_diskon >= 0),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status promo_status_type DEFAULT 'Aktif',
    keterangan TEXT,
    prioritas INTEGER DEFAULT 0 CHECK (prioritas >= 0),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT check_tanggal_promo CHECK (tanggal_mulai <= tanggal_selesai),
    CONSTRAINT check_persen_limit CHECK ((jenis_diskon = 'Persen' AND nilai_diskon <= 100) OR (jenis_diskon != 'Persen'))
);

-- 5. Tabel pembayaran
CREATE TABLE pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak),
    periode TEXT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    nominal NUMERIC NOT NULL,
    status_pembayaran TEXT DEFAULT 'Belum Bayar',
    metode_pembayaran TEXT NOT NULL,
    catatan TEXT,
    harga_normal NUMERIC,
    jenis_diskon jenis_diskon_type,
    nilai_diskon NUMERIC,
    nominal_diskon NUMERIC,
    total_tagihan NUMERIC,
    id_promo UUID REFERENCES promo(id_promo),
    nama_promo_snapshot TEXT,
    persentase_snapshot NUMERIC,
    UNIQUE (id_kontrak, periode)
);

-- 7. Tabel promo_penyewa
CREATE TABLE promo_penyewa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_promo UUID REFERENCES promo(id_promo) ON DELETE CASCADE,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (id_promo, id_penyewa)
);

-- 8. Tabel audit_log
CREATE TABLE audit_log (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waktu TIMESTAMP DEFAULT now(),
    id_user UUID REFERENCES users(id),
    role TEXT NOT NULL,
    aktivitas TEXT NOT NULL,
    nama_tabel TEXT NOT NULL,
    id_data TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB
);

-- 9. Modul Tagihan (Piutang)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tagihan_type') THEN
        CREATE TYPE status_tagihan_type AS ENUM ('Belum Bayar', 'Sebagian', 'Lunas', 'Terlambat', 'Write Off', 'Dibatalkan');
    ELSE
        -- Update existing enum if possible or handle via ALTER if needed. 
        -- In Supabase/Postgres we usually use ALTER TYPE
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Terlambat';
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Write Off';
        ALTER TYPE status_tagihan_type ADD VALUE IF NOT EXISTS 'Dibatalkan';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS riwayat_generate_tagihan (
    id_generate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL, -- 'MM-YYYY'
    tanggal_generate TIMESTAMP DEFAULT now(),
    id_user UUID REFERENCES users(id),
    jumlah_tagihan INTEGER DEFAULT 0,
    total_nominal NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Selesai'
);

CREATE TABLE IF NOT EXISTS tagihan (
    id_tagihan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE CASCADE,
    periode TEXT NOT NULL, -- 'MM-YYYY'
    jatuh_tempo DATE NOT NULL,
    nominal_tagihan NUMERIC NOT NULL,
    id_promo UUID REFERENCES promo(id_promo),
    nominal_diskon NUMERIC DEFAULT 0,
    total_tagihan NUMERIC NOT NULL,
    terbayar NUMERIC DEFAULT 0,
    status_tagihan status_tagihan_type DEFAULT 'Belum Bayar',
    catatan TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(id_kontrak, periode)
);

CREATE TABLE IF NOT EXISTS alokasi_pembayaran (
    id_alokasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembayaran UUID REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
    id_tagihan UUID REFERENCES tagihan(id_tagihan) ON DELETE CASCADE,
    nominal_alokasi NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- WA Reminder Logging
CREATE TABLE IF NOT EXISTS log_wa_tagihan (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_penyewa UUID REFERENCES penyewa(id_penyewa),
    id_user UUID REFERENCES users(id),
    tanggal_kirim TIMESTAMP DEFAULT now(),
    jumlah_tagihan_dilampirkan INTEGER,
    total_piutang_wa NUMERIC,
    status_kirim TEXT DEFAULT 'Berhasil',
    pesan_error TEXT
);

-- Update Pembayaran & Penyewa
ALTER TABLE pembayaran ADD COLUMN IF NOT EXISTS id_penyewa UUID REFERENCES penyewa(id_penyewa);
ALTER TABLE penyewa ADD COLUMN IF NOT EXISTS saldo_titipan NUMERIC DEFAULT 0;

-- Indexes
CREATE INDEX idx_promo_status ON promo(status);
CREATE INDEX idx_promo_tanggal ON promo(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_promo_penyewa_promo ON promo_penyewa(id_promo);
CREATE INDEX idx_promo_penyewa_penyewa ON promo_penyewa(id_penyewa);
CREATE INDEX idx_pembayaran_promo ON pembayaran(id_promo);
CREATE INDEX idx_tagihan_kontrak ON tagihan(id_kontrak);
CREATE INDEX idx_tagihan_periode ON tagihan(periode);
CREATE INDEX idx_tagihan_status ON tagihan(status_tagihan);
CREATE INDEX idx_alokasi_pembayaran ON alokasi_pembayaran(id_pembayaran);
CREATE INDEX idx_alokasi_tagihan ON alokasi_pembayaran(id_tagihan);

-- Triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql'
SET search_path = public;

CREATE TRIGGER set_updated_at_promo
    BEFORE UPDATE ON promo
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_tagihan
    BEFORE UPDATE ON tagihan
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Security: Row Level Security (RLS)
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

-- Shared Policy: Allow all operations for authenticated users (handled by API logic)
-- Since we use service_role key in our API routes, these policies primarily serve to satisfy the linter
-- and protect against direct public access if the anon key is used.

-- Users Policy
CREATE POLICY "Users access" ON users FOR ALL TO authenticated USING (true);

-- Unit Policy
CREATE POLICY "Unit access" ON unit FOR ALL TO authenticated USING (true);

-- Penyewa Policy
CREATE POLICY "Penyewa access" ON penyewa FOR ALL TO authenticated USING (true);

-- Kontrak Policy
CREATE POLICY "Kontrak access" ON kontrak_sewa FOR ALL TO authenticated USING (true);

-- Pembayaran Policy
CREATE POLICY "Pembayaran access" ON pembayaran FOR ALL TO authenticated USING (true);

-- Promo Policy
CREATE POLICY "Promo access" ON promo FOR ALL TO authenticated USING (true);

-- Promo Penyewa Policy
CREATE POLICY "Promo Penyewa access" ON promo_penyewa FOR ALL TO authenticated USING (true);

-- Audit Log Policy
CREATE POLICY "Audit Log access" ON audit_log FOR ALL TO authenticated USING (true);

-- Riwayat Generate Policy
CREATE POLICY "Riwayat Generate access" ON riwayat_generate_tagihan FOR ALL TO authenticated USING (true);

-- Tagihan Policy
CREATE POLICY "Tagihan access" ON tagihan FOR ALL TO authenticated USING (true);

-- Alokasi Pembayaran Policy
CREATE POLICY "Alokasi Pembayaran access" ON alokasi_pembayaran FOR ALL TO authenticated USING (true);

