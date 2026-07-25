-- SQL Migration: Final Refinement Promo & Diskon

-- 1. Tambah kolom persentase_snapshot pada tabel pembayaran
ALTER TABLE pembayaran ADD COLUMN IF NOT EXISTS persentase_snapshot NUMERIC;

-- 2. Ubah tipe data pembayaran.jenis_diskon menjadi ENUM jenis_diskon_type
-- Kita perlu casting jika kolom sudah ada dan berisi teks.
-- Namun karena jenis_diskon_type sudah dibuat di migrasi sebelumnya, kita bisa menggunakannya.
DO $$ 
BEGIN
    -- Cek jika tipe datanya masih TEXT
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'pembayaran' AND column_name = 'jenis_diskon') = 'text' THEN
        ALTER TABLE pembayaran 
        ALTER COLUMN jenis_diskon TYPE jenis_diskon_type 
        USING jenis_diskon::jenis_diskon_type;
    END IF;
END $$;

-- 3. Tambah CHECK constraint pada prioritas di tabel promo
ALTER TABLE promo DROP CONSTRAINT IF EXISTS check_prioritas_non_negatif;
ALTER TABLE promo ADD CONSTRAINT check_prioritas_non_negatif CHECK (prioritas >= 0);

-- 4. Indeks tambahan jika diperlukan (sudah cukup banyak sebelumnya)
