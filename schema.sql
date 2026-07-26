-- SEWAIN Application Database Schema (FIXED)
DROP TABLE IF EXISTS log_wa_tagihan, riwayat_generate_tagihan, audit_log, alokasi_pembayaran, pembayaran, tagihan, promo_penyewa, promo, kontrak_sewa, penyewa, unit, users CASCADE;
DROP TYPE IF EXISTS jenis_diskon_type CASCADE;
DROP TYPE IF EXISTS promo_status_type CASCADE;
DROP TYPE IF EXISTS status_tagihan_type CASCADE;

CREATE TYPE jenis_diskon_type AS ENUM ('Persen', 'Nominal');
CREATE TYPE promo_status_type AS ENUM ('Aktif', 'Tidak Aktif');
CREATE TYPE status_tagihan_type AS ENUM ('Belum Bayar', 'Sebagian', 'Lunas', 'Terlambat', 'Write Off', 'Dibatalkan');

BEGIN;
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
CREATE TABLE kontrak_sewa (
    id_kontrak PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kontrak TEXT UNIQUE NOT NULL,
    id_unit UUID REFERENCES unit(id_unit) ON DELETE RESTRICT,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    tanggal_masuk DATE NOT NULL,
    tanggal_keluar DATE,
    tanggal_jatuh_tempo INT NOT NULL,
    status_kontrak TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
-- ... (rest of the tables)
COMMIT;
