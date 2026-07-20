-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin', -- 'Owner' or 'Admin'
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: unit
CREATE TABLE IF NOT EXISTS unit (
  id_unit UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_unit TEXT NOT NULL,
  jenis_unit TEXT NOT NULL, -- 'Kios', 'Stand', 'Kos AC', 'Kos Non-AC'
  harga_sewa NUMERIC NOT NULL,
  status_unit TEXT NOT NULL DEFAULT 'Kosong' -- 'Terisi' or 'Kosong'
);

-- Table: penyewa
CREATE TABLE IF NOT EXISTS penyewa (
  id_penyewa UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT
);

-- Table: kontrak_sewa
CREATE TABLE IF NOT EXISTS kontrak_sewa (
  id_kontrak UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_unit UUID REFERENCES unit(id_unit),
  id_penyewa UUID REFERENCES penyewa(id_penyewa),
  nomor_kontrak TEXT NOT NULL,
  tanggal_masuk DATE NOT NULL,
  tanggal_keluar DATE,
  tanggal_jatuh_tempo DATE NOT NULL,
  status_kontrak TEXT NOT NULL DEFAULT 'Aktif' -- 'Aktif' or 'Selesai'
);

-- Table: pembayaran
CREATE TABLE IF NOT EXISTS pembayaran (
  id_pembayaran UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak),
  periode TEXT NOT NULL, -- 'MM-YYYY'
  nominal NUMERIC NOT NULL,
  tanggal_bayar TIMESTAMP WITH TIME ZONE,
  status_pembayaran TEXT NOT NULL -- 'Lunas', 'Belum Bayar', 'Terlambat'
);

-- Table: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID REFERENCES users(id),
  aktivitas TEXT NOT NULL,
  nama_tabel TEXT NOT NULL,
  id_data TEXT,
  data_lama JSONB,
  data_baru JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kontrak_sewa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
