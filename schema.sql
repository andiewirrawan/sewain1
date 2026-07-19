-- SQL Script untuk Supabase SQL Editor

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
    UNIQUE (id_kontrak, periode)
);

-- 6. Tabel audit_log
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
