-- Migration: Menambahkan Fitur Promo & Diskon

-- 1. Tabel promo
CREATE TABLE IF NOT EXISTS promo (
    id_promo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_promo TEXT NOT NULL,
    jenis_diskon TEXT CHECK (jenis_diskon IN ('Persen', 'Nominal')) NOT NULL,
    nilai_diskon NUMERIC NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status TEXT CHECK (status IN ('Aktif', 'Tidak Aktif')) DEFAULT 'Aktif',
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 2. Tabel promo_penyewa
CREATE TABLE IF NOT EXISTS promo_penyewa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_promo UUID REFERENCES promo(id_promo) ON DELETE CASCADE,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Update tabel pembayaran
ALTER TABLE pembayaran 
ADD COLUMN IF NOT EXISTS harga_normal NUMERIC,
ADD COLUMN IF NOT EXISTS jenis_diskon TEXT,
ADD COLUMN IF NOT EXISTS nilai_diskon NUMERIC,
ADD COLUMN IF NOT EXISTS nominal_diskon NUMERIC,
ADD COLUMN IF NOT EXISTS total_tagihan NUMERIC,
ADD COLUMN IF NOT EXISTS id_promo UUID REFERENCES promo(id_promo);

-- Update existing data in pembayaran if any
UPDATE pembayaran SET total_tagihan = nominal, harga_normal = nominal WHERE total_tagihan IS NULL;
