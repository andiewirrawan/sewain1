-- SEWAIN - OPERATIONAL BUSINESS SEED SCRIPT (FIXED)
-- Simulates 7 months of history

BEGIN;

-- 1. USERS
INSERT INTO users (id, nama, email, password, role, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Budi Santoso', 'owner@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Owner', 'Aktif'),
  ('22222222-2222-2222-2222-222222222222', 'Siti Rahmawati', 'admin@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Admin', 'Aktif'),
  ('33333333-3333-3333-3333-333333333333', 'Dewa System Owner', 'system@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'System Owner', 'Aktif');

-- 2. UNIT PROPERTI
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit) VALUES
  ('c1c1c1c1-0000-0000-0000-000000000001', 'RUKO-A01', 'Ruko', 'Ruko 2 Lantai Utama', 'A01', 7500000.00, 'Kosong'),
  ('c1c1c1c1-0000-0000-0000-000000000002', 'RUKO-A02', 'Ruko', 'Ruko 2 Lantai Utama', 'A02', 7500000.00, 'Kosong'),
  ('c1c1c1c1-0000-0000-0000-000000000003', 'RUKO-A03', 'Ruko', 'Ruko 2 Lantai Utama', 'A03', 8000000.00, 'Kosong'),
  ('c2c2c2c2-0000-0000-0000-000000000001', 'KIOS-B01', 'Kios', 'Kios Depan Kuliner', 'B01', 3500000.00, 'Kosong'),
  ('c2c2c2c2-0000-0000-0000-000000000005', 'KIOS-B05', 'Kios', 'Kios Tengah Retail', 'B05', 2800000.00, 'Kosong'),
  ('c3c3c3c3-0000-0000-0000-000000000001', 'KOST-C01', 'Kost Eksklusif', 'Kamar Lantai 1 Deluxe', 'C01', 2200000.00, 'Kosong');

-- 3. PENYEWA
INSERT INTO penyewa (id_penyewa, nama, nik, email, whatsapp, kontak_darurat, jenis_usaha) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Bambang Sudarsono', '3171011203850001', 'bambang.kopi@gmail.com', '081234567890', '081298765432', 'Kuliner'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Hj. Salmah Padang', '3171015507780002', 'salmah@gmail.com', '081311223344', '081399887766', 'Kuliner'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Hendra Wijaya', '3174041001870005', 'hendra@gmail.com', '081822334455', '081866778899', 'Jasa'),
  ('bbbbbbbb-0000-0000-0000-000000000015', 'Gito Suherman', '3171031908810015', 'gito@gmail.com', '081344556677', '081388990011', 'Jasa');

-- 4. PROMO (Set status to 'Aktif' for simulation to work)
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'Diskon Tahun Baru 2026', 'Nominal', 500000.00, '2026-01-01', '2026-01-31', 'Aktif'),
  ('dddddddd-0000-0000-0000-000000000002', 'Promo Ramadhan Berkah', 'Persen', 10.00, '2026-03-01', '2026-04-30', 'Aktif');

-- Link Promo to Tenants
INSERT INTO promo_penyewa (id_promo, id_penyewa) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002'),
  ('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000005');

-- 5. KONTRAK SEWA
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_jatuh_tempo, status_kontrak) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'KTR-202601-001', 'c1c1c1c1-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-01-01', 5, 'Aktif'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'KTR-202601-002', 'c1c1c1c1-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-01-01', 10, 'Aktif'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'KTR-202601-005', 'c2c2c2c2-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000005', '2026-01-01', 10, 'Aktif'),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'KTR-202601-009', 'c2c2c2c2-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000015', '2026-01-10', 10, 'Aktif');

-- Update Unit Status
UPDATE unit SET status_unit = 'Terisi' WHERE id_unit IN (SELECT id_unit FROM kontrak_sewa WHERE status_kontrak = 'Aktif');

-- 6. OPERATIONAL SIMULATION
DO $$
DECLARE
  v_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- JANUARI 2026
  PERFORM generate_tagihan_periode('01-2026', v_user_id);
  
  -- Bambang Sudarsono - Tagihan 7.5M - Diskon 500k = 7M. Bayar 7M.
  PERFORM proses_pembayaran_fifo('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '01-2026', '2026-01-04', 7000000.00, 'Transfer BCA', v_user_id, 'Lunas Jan');
  
  -- Hj Salmah - Tagihan 7M. Bayar 8M. (Titip 1M)
  PERFORM proses_pembayaran_fifo('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', '01-2026', '2026-01-08', 8000000.00, 'Transfer Mandiri', v_user_id, 'Overpayment Jan');

  -- FEBRUARI 2026
  -- Sistem otomatis memakai saldo titipan Hj Salmah (1M)
  PERFORM generate_tagihan_periode('02-2026', v_user_id);
  
  -- MARET 2026 (Ramadhan Promo)
  PERFORM generate_tagihan_periode('03-2026', v_user_id);
END $$;

COMMIT;
