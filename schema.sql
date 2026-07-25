-- SQL Script untuk Supabase SQL Editor

-- 0. Custom Types
CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');

-- 1. Tabel users
CREATE TABLE users (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id_user UUID REFERENCES users(id_user),
    role TEXT NOT NULL,
    aktivitas TEXT NOT NULL,
    nama_tabel TEXT NOT NULL,
    id_data TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB
);

-- Indexes
CREATE INDEX idx_promo_status ON promo(status);
CREATE INDEX idx_promo_tanggal ON promo(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_promo_penyewa_promo ON promo_penyewa(id_promo);
CREATE INDEX idx_promo_penyewa_penyewa ON promo_penyewa(id_penyewa);
CREATE INDEX idx_pembayaran_promo ON pembayaran(id_promo);

-- Triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at_promo
    BEFORE UPDATE ON promo
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

