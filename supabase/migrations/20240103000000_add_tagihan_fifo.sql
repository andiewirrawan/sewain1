-- SQL Migration: Modul Tagihan & FIFO (Piutang)

-- 1. Custom Types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tagihan_type') THEN
        CREATE TYPE status_tagihan_type AS ENUM ('Belum Bayar', 'Sebagian', 'Lunas', 'Batal');
    END IF;
END $$;

-- 2. Tabel Riwayat Generate
CREATE TABLE IF NOT EXISTS riwayat_generate_tagihan (
    id_generate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL, -- 'MM-YYYY'
    tanggal_generate TIMESTAMP DEFAULT now(),
    id_user UUID REFERENCES users(id),
    jumlah_tagihan INTEGER DEFAULT 0,
    total_nominal NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Selesai'
);

-- 3. Tabel Tagihan
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

-- 4. Tabel Alokasi Pembayaran (Jantung FIFO)
CREATE TABLE IF NOT EXISTS alokasi_pembayaran (
    id_alokasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembayaran UUID REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
    id_tagihan UUID REFERENCES tagihan(id_tagihan) ON DELETE CASCADE,
    nominal_alokasi NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 5. Update Tabel Pembayaran
ALTER TABLE pembayaran ADD COLUMN IF NOT EXISTS id_penyewa UUID REFERENCES penyewa(id_penyewa);

-- 6. Indexing
CREATE INDEX IF NOT EXISTS idx_tagihan_kontrak ON tagihan(id_kontrak);
CREATE INDEX IF NOT EXISTS idx_tagihan_periode ON tagihan(periode);
CREATE INDEX IF NOT EXISTS idx_tagihan_status ON tagihan(status_tagihan);
CREATE INDEX IF NOT EXISTS idx_alokasi_pembayaran ON alokasi_pembayaran(id_pembayaran);
CREATE INDEX IF NOT EXISTS idx_alokasi_tagihan ON alokasi_pembayaran(id_tagihan);

-- 7. Trigger Updated At
DROP TRIGGER IF EXISTS set_updated_at_tagihan ON tagihan;
CREATE TRIGGER set_updated_at_tagihan
    BEFORE UPDATE ON tagihan
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 8. Migrasi Data Lama
-- Catatan: Fungsi migrasi ini memindahkan pembayaran lama ke struktur tagihan+alokasi
-- agar aplikasi tidak "lupa" dengan histori pembayaran yang sudah ada.
DO $$
DECLARE
    r RECORD;
    new_id_tagihan UUID;
    v_id_penyewa UUID;
BEGIN
    FOR r IN SELECT p.*, ks.id_penyewa as pen_id 
             FROM pembayaran p 
             JOIN kontrak_sewa ks ON p.id_kontrak = ks.id_kontrak 
             WHERE p.id_pembayaran NOT IN (SELECT id_pembayaran FROM alokasi_pembayaran) LOOP
        
        -- Update id_penyewa di pembayaran jika masih null
        UPDATE pembayaran SET id_penyewa = r.pen_id WHERE id_pembayaran = r.id_pembayaran;

        -- Buat tagihan bayangan
        INSERT INTO tagihan (id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan, terbayar, status_tagihan, created_at)
        VALUES (r.id_kontrak, r.periode, r.tanggal_bayar::date, COALESCE(r.harga_normal, r.nominal), r.id_promo, COALESCE(r.nominal_diskon, 0), r.nominal, r.nominal, 'Lunas', r.tanggal_bayar)
        ON CONFLICT (id_kontrak, periode) DO UPDATE SET terbayar = tagihan.total_tagihan, status_tagihan = 'Lunas'
        RETURNING id_tagihan INTO new_id_tagihan;

        -- Catat alokasinya
        INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi, created_at)
        VALUES (r.id_pembayaran, new_id_tagihan, r.nominal, r.tanggal_bayar);
    END LOOP;
END $$;
