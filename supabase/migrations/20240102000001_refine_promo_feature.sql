-- SQL Migration: Refinement Promo & Diskon (Production Ready)

-- 1. ENUM Types (Idempotent check)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_diskon_type') THEN
        CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_status_type') THEN
        CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');
    END IF;
END $$;

-- 2. Fungsi Trigger Updated At
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tabel Promo (Sempurnakan)
-- Note: Kita asumsikan tabel promo sudah ada dari migrasi sebelumnya, jadi kita gunakan ALTER
-- Jika belum ada, migrasi sebelumnya akan membuatnya.

-- Tambah kolom prioritas
ALTER TABLE promo ADD COLUMN IF NOT EXISTS prioritas INTEGER DEFAULT 0;

-- Tambah constraint validasi
ALTER TABLE promo DROP CONSTRAINT IF EXISTS check_nilai_diskon_non_negatif;
ALTER TABLE promo ADD CONSTRAINT check_nilai_diskon_non_negatif CHECK (nilai_diskon >= 0);

ALTER TABLE promo DROP CONSTRAINT IF EXISTS check_persen_limit;
ALTER TABLE promo ADD CONSTRAINT check_persen_limit CHECK (
    (jenis_diskon = 'Persen' AND nilai_diskon <= 100) OR (jenis_diskon != 'Persen')
);

ALTER TABLE promo DROP CONSTRAINT IF EXISTS check_tanggal_promo;
ALTER TABLE promo ADD CONSTRAINT check_tanggal_promo CHECK (tanggal_mulai <= tanggal_selesai);

-- Tambah Trigger
DROP TRIGGER IF EXISTS set_updated_at_promo ON promo;
CREATE TRIGGER set_updated_at_promo
    BEFORE UPDATE ON promo
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 4. Tabel Promo Penyewa (Sempurnakan)
-- Tambah Unique Constraint
ALTER TABLE promo_penyewa DROP CONSTRAINT IF EXISTS id_promo_id_penyewa_unique;
ALTER TABLE promo_penyewa ADD CONSTRAINT id_promo_id_penyewa_unique UNIQUE (id_promo, id_penyewa);

-- 5. Tabel Pembayaran (Sempurnakan)
ALTER TABLE pembayaran ADD COLUMN IF NOT EXISTS nama_promo_snapshot TEXT;

-- 6. Indexing (Idempotent)
CREATE INDEX IF NOT EXISTS idx_promo_status ON promo(status);
CREATE INDEX IF NOT EXISTS idx_promo_tanggal ON promo(tanggal_mulai, tanggal_selesai);
CREATE INDEX IF NOT EXISTS idx_promo_penyewa_promo ON promo_penyewa(id_promo);
CREATE INDEX IF NOT EXISTS idx_promo_penyewa_penyewa ON promo_penyewa(id_penyewa);
CREATE INDEX IF NOT EXISTS idx_pembayaran_promo ON pembayaran(id_promo);

-- 7. Migrasi Data Lama (Jika ada)
-- Memastikan kolom-kolom baru di pembayaran terisi jika ada data lama
UPDATE pembayaran 
SET 
    total_tagihan = COALESCE(total_tagihan, nominal),
    harga_normal = COALESCE(harga_normal, nominal),
    nominal_diskon = COALESCE(nominal_diskon, 0),
    nilai_diskon = COALESCE(nilai_diskon, 0)
WHERE total_tagihan IS NULL OR harga_normal IS NULL;
