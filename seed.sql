-- =================================================================================
-- SEWAIN - OPERATIONAL BUSINESS SEED SCRIPT (2026)
-- Simulates 7 months of realistic operational history (Januari 2026 - Juli 2026)
-- Multi-user, multi-unit, FIFO payment allocations, deposit tracking, promos,
-- bad-debt write offs, and WhatsApp logs.
-- =================================================================================

BEGIN;

-- Reset table data cleanly
TRUNCATE TABLE log_wa_tagihan, audit_log, riwayat_generate_tagihan, alokasi_pembayaran, 
               pembayaran, tagihan, promo_penyewa, promo, kontrak_sewa, penyewa, unit, users CASCADE;

-- ---------------------------------------------------------------------------------
-- 1. USERS (Sistem & Operasional)
-- ---------------------------------------------------------------------------------
INSERT INTO users (id, nama, email, password, role, status, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Budi Santoso', 'owner@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Owner', 'Aktif', '2025-12-01 08:00:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Siti Rahmawati', 'admin@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Admin', 'Aktif', '2025-12-05 09:00:00+07'),
  ('33333333-3333-3333-3333-333333333333', 'Dewa System Owner', 'system@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'System Owner', 'Aktif', '2025-11-01 00:00:00+07');

-- ---------------------------------------------------------------------------------
-- 2. UNIT PROPERTI (40 Unit: Ruko, Kios, Kost Eksklusif, Ruang Kantor)
-- ---------------------------------------------------------------------------------
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit, created_at) VALUES
  -- Ruko (A01 - A10) - Rp 6.000.000 - Rp 8.500.000
  ('u0000001-0000-0000-0000-000000000001', 'RUKO-A01', 'Ruko', 'Ruko 2 Lantai Utama', 'A01', 7500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000002', 'RUKO-A02', 'Ruko', 'Ruko 2 Lantai Utama', 'A02', 7500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000003', 'RUKO-A03', 'Ruko', 'Ruko 2 Lantai Utama', 'A03', 8000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000004', 'RUKO-A04', 'Ruko', 'Ruko 3 Lantai Corner', 'A04', 8500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000005', 'RUKO-A05', 'Ruko', 'Ruko 2 Lantai Standar', 'A05', 6500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000006', 'RUKO-A06', 'Ruko', 'Ruko 2 Lantai Standar', 'A06', 6500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000007', 'RUKO-A07', 'Ruko', 'Ruko 2 Lantai Standar', 'A07', 6000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000008', 'RUKO-A08', 'Ruko', 'Ruko 2 Lantai Standar', 'A08', 6000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000009', 'RUKO-A09', 'Ruko', 'Ruko 3 Lantai VIP', 'A09', 8500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000001-0000-0000-0000-000000000010', 'RUKO-A10', 'Ruko', 'Ruko 3 Lantai VIP', 'A10', 8500000.00, 'Kosong', '2025-12-10 08:00:00+07'),

  -- Kios (B01 - B12) - Rp 2.500.000 - Rp 3.500.000
  ('u0000002-0000-0000-0000-000000000001', 'KIOS-B01', 'Kios', 'Kios Depan Kuliner', 'B01', 3500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000002', 'KIOS-B02', 'Kios', 'Kios Depan Kuliner', 'B02', 3500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000003', 'KIOS-B03', 'Kios', 'Kios Tengah Jasa', 'B03', 3000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000004', 'KIOS-B04', 'Kios', 'Kios Tengah Jasa', 'B04', 3000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000005', 'KIOS-B05', 'Kios', 'Kios Tengah Retail', 'B05', 2800000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000006', 'KIOS-B06', 'Kios', 'Kios Tengah Retail', 'B06', 2800000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000007', 'KIOS-B07', 'Kios', 'Kios Belakang Laundry', 'B07', 2500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000008', 'KIOS-B08', 'Kios', 'Kios Belakang Gudang', 'B08', 2500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000009', 'KIOS-B09', 'Kios', 'Kios Samping Parkiran', 'B09', 3200000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000010', 'KIOS-B10', 'Kios', 'Kios Samping Parkiran', 'B10', 3200000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000011', 'KIOS-B11', 'Kios', 'Kios Mini Corner', 'B11', 2700000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000002-0000-0000-0000-000000000012', 'KIOS-B12', 'Kios', 'Kios Mini Corner', 'B12', 2700000.00, 'Kosong', '2025-12-10 08:00:00+07'),

  -- Kost Eksklusif (C01 - C10) - Rp 1.800.000 - Rp 2.300.000
  ('u0000003-0000-0000-0000-000000000001', 'KOST-C01', 'Kost Eksklusif', 'Kamar Lantai 1 AC/KM Dalam', 'C01', 2200000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000002', 'KOST-C02', 'Kost Eksklusif', 'Kamar Lantai 1 AC/KM Dalam', 'C02', 2200000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000003', 'KOST-C03', 'Kost Eksklusif', 'Kamar Lantai 1 AC/KM Dalam', 'C03', 2200000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000004', 'KOST-C04', 'Kost Eksklusif', 'Kamar Lantai 2 Balok Balkon', 'C04', 2300000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000005', 'KOST-C05', 'Kost Eksklusif', 'Kamar Lantai 2 Balok Balkon', 'C05', 2300000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000006', 'KOST-C06', 'Kost Eksklusif', 'Kamar Lantai 2 Standar AC', 'C06', 2000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000007', 'KOST-C07', 'Kost Eksklusif', 'Kamar Lantai 2 Standar AC', 'C07', 2000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000008', 'KOST-C08', 'Kost Eksklusif', 'Kamar Lantai 3 Hemat AC', 'C08', 1800000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000009', 'KOST-C09', 'Kost Eksklusif', 'Kamar Lantai 3 Hemat AC', 'C09', 1800000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000003-0000-0000-0000-000000000010', 'KOST-C10', 'Kost Eksklusif', 'Kamar Lantai 3 Hemat AC', 'C10', 1800000.00, 'Kosong', '2025-12-10 08:00:00+07'),

  -- Ruang Kantor (D01 - D08) - Rp 4.500.000 - Rp 5.500.000
  ('u0000004-0000-0000-0000-000000000001', 'KANTOR-D01', 'Ruang Kantor', 'Office Suite Level 1', 'D01', 5500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000002', 'KANTOR-D02', 'Ruang Kantor', 'Office Suite Level 1', 'D02', 5500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000003', 'KANTOR-D03', 'Ruang Kantor', 'Office Space Medium', 'D03', 5000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000004', 'KANTOR-D04', 'Ruang Kantor', 'Office Space Medium', 'D04', 5000000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000005', 'KANTOR-D05', 'Ruang Kantor', 'Office Space Compact', 'D05', 4500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000006', 'KANTOR-D06', 'Ruang Kantor', 'Office Space Compact', 'D06', 4500000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000007', 'KANTOR-D07', 'Ruang Kantor', 'Studio Office', 'D07', 4800000.00, 'Kosong', '2025-12-10 08:00:00+07'),
  ('u0000004-0000-0000-0000-000000000008', 'KANTOR-D08', 'Ruang Kantor', 'Studio Office', 'D08', 4800000.00, 'Kosong', '2025-12-10 08:00:00+07');

-- ---------------------------------------------------------------------------------
-- 3. DATA PENYEWA (25 Penyewa Profil Realistis)
-- ---------------------------------------------------------------------------------
INSERT INTO penyewa (id_penyewa, nama, nik, alamat, email, whatsapp, kontak_darurat, jenis_usaha, saldo_titipan, created_at) VALUES
  ('p0000001-0000-0000-0000-000000000001', 'Bambang Sudarsono', '3171011203850001', 'Jl. Sudirman No. 45, Jakarta Selatan', 'bambang.kopi@gmail.com', '081234567890', '081298765432 (Istri - Ratna)', 'Kuliner - Kopi Kekinian', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000002', 'Hj. Salmah Padang', '3171015507780002', 'Jl. Tebet Raya No. 12, Jakarta Selatan', 'rm.sederhana.sewain@gmail.com', '081311223344', '081399887766 (Anak - Farhan)', 'Kuliner - Restoran Padang', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000003', 'Rahmat Hidayat', '3172021508900003', 'Jl. Kemang Selatan No. 88, Jakarta Selatan', 'rahmat.digital@creative.id', '081566778899', '081511223344 (Adik - Hendra)', 'Jasa - Agency Digital Marketing', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000004', 'Dr. Amanda Putri, Sp.DVE', '3173034411920004', 'Jl. Mampang Prapatan No. 20, Jakarta', 'dr.amanda.clinic@gmail.com', '081799001122', '081755443322 (Suami - dr. Rizky)', 'Kesehatan - Klinik Kecantikan', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000005', 'Hendra Wijaya', '3174041001870005', 'Jl. Gatot Subroto No. 102, Jakarta', 'hendra.laundry@express.co.id', '081822334455', '081866778899 (Manajer Ops - Anton)', 'Jasa - Laundry Kilat', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000006', 'Siska Aprillia', '3201015004950006', 'Jl. Raya Bogor Km 28, Depok', 'siska.fashion@boutique.com', '081933445566', '081988776655 (Ibu - Yanti)', 'Retail - Hijab & Fashion Muslim', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000007', 'Agus Prayitno', '3275021802830007', 'Jl. Bekasi Timur No. 15, Bekasi', 'agus.minimarket@gmail.com', '082111223344', '082155667788 (Saudara - Joko)', 'Retail - Minimarket Kelontong', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000008', 'Dewi Lestari', '3175056209930008', 'Jl. Pasar Minggu No. 77, Jakarta', 'dewi.apotek@sehat.com', '082233445566', '082277889900 (Apoteker - Maya)', 'Kesehatan - Apotek Mandiri', 0, '2025-12-15'),
  ('p0000001-0000-0000-0000-000000000009', 'Rian Nugraha', '3171020506940009', 'Jl. Radio Dalam No. 3, Jakarta', 'rian.barbershop@gmail.com', '082344556677', '082388990011 (Teman - Randy)', 'Jasa - Gentlemen Barbershop', 0, '2025-12-20'),
  ('p0000001-0000-0000-0000-000000000010', 'Maya Kusuma', '3172035112960010', 'Jl. Fatmawati No. 9, Jakarta Selatan', 'maya.kusuma96@gmail.com', '085677889900', '085611223344 (Ayah - Bpk. Kusuma)', 'Karyawan Swasta (Kost)', 0, '2025-12-20'),
  ('p0000001-0000-0000-0000-000000000011', 'Fajar Ramadhan', '3173011403980011', 'Jl. Cilandak KKO No. 18, Jakarta', 'fajar.ramadhan.tech@gmail.com', '085788990011', '085722334455 (Ibu - Ningsih)', 'Software Engineer (Kost)', 0, '2025-12-20'),
  ('p0000001-0000-0000-0000-000000000012', 'Nadia Utami', '3174026507970012', 'Jl. Panglima Polim No. 34, Jakarta', 'nadia.utami.design@gmail.com', '085899001122', '085833445566 (Kakak - Dian)', 'UI/UX Designer (Kost)', 0, '2025-12-20'),
  ('p0000001-0000-0000-0000-000000000013', 'Reza Pratama', '3175012210920013', 'Jl. Ampera Raya No. 50, Jakarta', 'reza.lawfirm@pratama.co.id', '081122334455', '081166778899 (Rekan - Advokat Arif)', 'Jasa - Kantor Konsultan Hukum', 0, '2025-12-20'),
  ('p0000001-0000-0000-0000-000000000014', 'Fitri Handayani', '3276014809910014', 'Jl. Margonda Raya No. 200, Depok', 'fitri.boba@bobaexpress.id', '081233445566', '081277889900 (Suami - Bayu)', 'Kuliner - Minuman Boba', 0, '2026-01-05'),
  ('p0000001-0000-0000-0000-000000000015', 'Gito Suherman', '3171031908810015', 'Jl. Warung Buncit No. 11, Jakarta', 'gito.servis.hp@gmail.com', '081344556677', '081388990011 (Adik - Yudi)', 'Jasa - Servis Elektonik & Gadget', 0, '2026-01-10'),
  ('p0000001-0000-0000-0000-000000000016', 'Lestari Indah', '3172046001890016', 'Jl. Pejaten Barat No. 8, Jakarta', 'lestari.florist@flower.com', '081455667788', '081499001122 (Ibu - Hartini)', 'Retail - Toko Bunga Florist', 0, '2026-01-15'),
  ('p0000001-0000-0000-0000-000000000017', 'Eko Purnomo', '3173050203860017', 'Jl. Kebayoran Lama No. 99, Jakarta', 'eko.purnomo.ekspedisi@gmail.com', '081566778800', '081500112233 (Istri - Sri)', 'Jasa - Agen Ekspedisi Logistik', 0, '2026-02-01'),
  ('p0000001-0000-0000-0000-000000000018', 'Drg. Nina Marlina', '3174015011910018', 'Jl. Cipete Raya No. 14, Jakarta', 'drg.nina.dental@gmail.com', '081677889911', '081611223355 (Asisten - Reni)', 'Kesehatan - Praktek Dokter Gigi', 0, '2026-02-10'),
  ('p0000001-0000-0000-0000-000000000019', 'Ahmad Zaelani', '3175021204880019', 'Jl. Bangka No. 25, Jakarta', 'ahmad.zaelani.roti@gmail.com', '081788990022', '081722334466 (Istri - Siti)', 'Kuliner - Bakery & Roti Bakar', 0, '2026-02-15'),
  ('p0000001-0000-0000-0000-000000000020', 'Tania Safitri', '3201026505990020', 'Jl. Akses UI No. 12, Depok', 'tania.safitri.studio@gmail.com', '081899001133', '081833445577 (Teman - Vivi)', 'Mahasiswi (Kost)', 0, '2026-03-01'),
  ('p0000001-0000-0000-0000-000000000021', 'Danang Prasetyo', '3171040807900021', 'Jl. H. Nawi No. 40, Jakarta', 'danang.architect@studio.id', '081900112244', '081944556688 (Rekan - Aris)', 'Jasa - Studio Arsitektur & Interior', 0, '2026-03-10'),
  ('p0000001-0000-0000-0000-000000000022', 'Riko Simanjuntak', '3172051909850022', 'Jl. Wolter Monginsidi No. 5, Jakarta', 'riko.petshop@gmail.com', '082111223355', '082155667799 (Istri - Monalisa)', 'Retail - Petshop & Grooming', 0, '2026-04-01'),
  ('p0000001-0000-0000-0000-000000000023', 'Yuliana Tan', '3173024810890023', 'Jl. Suryo No. 30, Jakarta', 'yuliana.bakery@gmail.com', '082222334466', '082266778800 (Suami - David)', 'Kuliner - Pastry & Cake', 0, '2026-05-01'),
  ('p0000001-0000-0000-0000-000000000024', 'Aris Budiman', '3174031506840024', 'Jl. Senopati No. 82, Jakarta', 'aris.budiman.fitness@gmail.com', '082333445577', '082377889911 (Adik - Tio)', 'Jasa - Personal Trainer Gym Studio', 0, '2026-05-15'),
  ('p0000001-0000-0000-0000-000000000025', 'Nugroho Tri', '3175042801930025', 'Jl. Melawai No. 18, Jakarta', 'nugroho.coffeelab@gmail.com', '082444556688', '082488990022 (Rekan - Faisal)', 'Kuliner - Specialty Coffee Shop', 0, '2026-06-01');

-- ---------------------------------------------------------------------------------
-- 4. PROMO & PROMO PENYEWA
-- ---------------------------------------------------------------------------------
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi, created_at) VALUES
  ('pr000001-0000-0000-0000-000000000001', 'Diskon Tahun Baru 2026', 'Nominal', 500000.00, '2026-01-01', '2026-01-31', 'Tidak Aktif', 'Potongan Rp 500.000 untuk tagihan periode Januari 2026 bagi penyewa baru.', '2025-12-25'),
  ('pr000001-0000-0000-0000-000000000002', 'Promo Ramadhan Berkah', 'Persen', 10.00, '2026-03-01', '2026-04-30', 'Tidak Aktif', 'Diskon 10% sewa selama bulan Ramadhan untuk penyewa Ruko & Kios.', '2026-02-20'),
  ('pr000001-0000-0000-0000-000000000003', 'Loyalty Tenant Special', 'Nominal', 300000.00, '2026-05-01', '2026-12-31', 'Aktif', 'Potongan Rp 300.000 bulanan untuk penyewa setia Ruko A01.', '2026-04-25');

-- Hubungkan Promo ke Penyewa
INSERT INTO promo_penyewa (id_promo, id_penyewa, created_at) VALUES
  ('pr000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', '2025-12-25'), -- Bambang Kopi
  ('pr000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000002', '2025-12-25'), -- Hj Salmah
  ('pr000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000005', '2026-02-20'), -- Hendra Laundry
  ('pr000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000006', '2026-02-20'), -- Siska Hijab
  ('pr000001-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000001', '2026-04-25'); -- Bambang Kopi

-- ---------------------------------------------------------------------------------
-- 5. KONTRAK SEWA (Simulasi Perjalanan Operasional Kontrak)
-- ---------------------------------------------------------------------------------
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_keluar, tanggal_jatuh_tempo, status_kontrak, created_at) VALUES
  -- Batch Januari 2026 (Aktif)
  ('k0000001-0000-0000-0000-000000000001', 'KTR-202601-001', 'u0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', '2026-01-01', '2026-12-31', 5, 'Aktif', '2025-12-20'),
  ('k0000001-0000-0000-0000-000000000002', 'KTR-202601-002', 'u0000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000002', '2026-01-01', '2026-12-31', 10, 'Aktif', '2025-12-20'),
  ('k0000001-0000-0000-0000-000000000003', 'KTR-202601-003', 'u0000001-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000003', '2026-01-01', '2026-12-31', 15, 'Aktif', '2025-12-21'),
  ('k0000001-0000-0000-0000-000000000004', 'KTR-202601-004', 'u0000001-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000004', '2026-01-01', '2026-12-31', 5, 'Aktif', '2025-12-21'),
  ('k0000001-0000-0000-0000-000000000005', 'KTR-202601-005', 'u0000002-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000005', '2026-01-01', '2026-12-31', 10, 'Aktif', '2025-12-22'),
  ('k0000001-0000-0000-0000-000000000006', 'KTR-202601-006', 'u0000002-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000006', '2026-01-01', '2026-12-31', 10, 'Aktif', '2025-12-22'),
  ('k0000001-0000-0000-0000-000000000007', 'KTR-202601-007', 'u0000002-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000007', '2026-01-01', '2026-12-31', 15, 'Aktif', '2025-12-23'),
  ('k0000001-0000-0000-0000-000000000008', 'KTR-202601-008', 'u0000002-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000008', '2026-01-01', '2026-12-31', 20, 'Aktif', '2025-12-23'),

  -- Kontrak lama yang Batal/Selesai prematur di Kios B05 (Pak Agus - P3 Batal di Mei 2026)
  ('k0000001-0000-0000-0000-000000000009', 'KTR-202601-009', 'u0000002-0000-0000-0000-000000000005', 'p0000001-0000-0000-0000-000000000015', '2026-01-10', '2026-04-30', 10, 'Selesai', '2026-01-10'),

  -- Kost Eksklusif (C01 - C05)
  ('k0000001-0000-0000-0000-000000000010', 'KTR-202601-010', 'u0000003-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000010', '2026-01-01', '2026-12-31', 1, 'Aktif', '2025-12-25'),
  ('k0000001-0000-0000-0000-000000000011', 'KTR-202601-011', 'u0000003-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000011', '2026-01-01', '2026-12-31', 5, 'Aktif', '2025-12-25'),
  ('k0000001-0000-0000-0000-000000000012', 'KTR-202601-012', 'u0000003-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000012', '2026-01-01', '2026-12-31', 5, 'Aktif', '2025-12-25'),

  -- Kantor (D01 - D03)
  ('k0000001-0000-0000-0000-000000000013', 'KTR-202601-013', 'u0000004-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000013', '2026-01-01', '2026-12-31', 1, 'Aktif', '2025-12-20'),

  -- Batch Februari 2026
  ('k0000001-0000-0000-0000-000000000014', 'KTR-202602-001', 'u0000002-0000-0000-0000-000000000006', 'p0000001-0000-0000-0000-000000000014', '2026-02-01', '2026-12-31', 10, 'Aktif', '2026-01-25'),
  ('k0000001-0000-0000-0000-000000000015', 'KTR-202602-002', 'u0000002-0000-0000-0000-000000000007', 'p0000001-0000-0000-0000-000000000016', '2026-02-15', '2026-12-31', 15, 'Aktif', '2026-02-10'),
  ('k0000001-0000-0000-0000-000000000016', 'KTR-202602-003', 'u0000004-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000018', '2026-02-10', '2026-12-31', 10, 'Aktif', '2026-02-05'),

  -- Batch Maret 2026
  ('k0000001-0000-0000-0000-000000000017', 'KTR-202603-001', 'u0000001-0000-0000-0000-000000000005', 'p0000001-0000-0000-0000-000000000017', '2026-03-01', '2026-12-31', 5, 'Aktif', '2026-02-25'),
  ('k0000001-0000-0000-0000-000000000018', 'KTR-202603-002', 'u0000003-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000020', '2026-03-01', '2026-12-31', 5, 'Aktif', '2026-02-28'),
  ('k0000001-0000-0000-0000-000000000019', 'KTR-202603-003', 'u0000004-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000021', '2026-03-10', '2026-12-31', 10, 'Aktif', '2026-03-05'),

  -- Batch April 2026
  ('k0000001-0000-0000-0000-000000000020', 'KTR-202604-001', 'u0000002-0000-0000-0000-000000000008', 'p0000001-0000-0000-0000-000000000022', '2026-04-01', '2026-12-31', 1, 'Aktif', '2026-03-28'),

  -- Batch Mei 2026
  ('k0000001-0000-0000-0000-000000000021', 'KTR-202605-001', 'u0000001-0000-0000-0000-000000000006', 'p0000001-0000-0000-0000-000000000023', '2026-05-01', '2026-12-31', 5, 'Aktif', '2026-04-28'),
  ('k0000001-0000-0000-0000-000000000022', 'KTR-202605-002', 'u0000002-0000-0000-0000-000000000005', 'p0000001-0000-0000-0000-000000000024', '2026-05-15', '2026-12-31', 15, 'Aktif', '2026-05-10'), -- Pengganti Kios B05

  -- Batch Juni 2026
  ('k0000001-0000-0000-0000-000000000023', 'KTR-202606-001', 'u0000001-0000-0000-0000-000000000007', 'p0000001-0000-0000-0000-000000000025', '2026-06-01', '2026-12-31', 5, 'Aktif', '2026-05-28');

-- Update status unit sesuai kontrak aktif
UPDATE unit SET status_unit = 'Terisi' WHERE id_unit IN (SELECT id_unit FROM kontrak_sewa WHERE status_kontrak = 'Aktif');

-- ---------------------------------------------------------------------------------
-- 6. SIMULASI PERJALANAN OPERASIONAL SEWAIN (BULAN PER BULAN)
-- ---------------------------------------------------------------------------------

DO $$
DECLARE
  v_user_id UUID := '11111111-1111-1111-1111-111111111111';
  v_res JSONB;
BEGIN
  -- ===============================================================================
  -- JANUARI 2026
  -- ===============================================================================
  v_res := generate_tagihan_periode('01-2026', v_user_id);

  -- Pembayaran Januari (Sebagian besar Lunas tepat waktu, 1 Sebagian, 1 Overpayment)
  
  -- 1. Bambang Sudarsono (Ruko A01) - Tagihan Rp 7.000.000 (setelah diskon Rp 500k) - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', 
    '01-2026', '2026-01-04', 7000000.00, 'Transfer BCA', v_user_id, 'Pembayaran sewa Januari 2026'
  );

  -- 2. Hj Salmah (Ruko A02) - Tagihan Rp 7.000.000 (diskon Rp 500k) - Overpayment Rp 8.000.000 (Titip Rp 1.000.000!)
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000002', 'k0000001-0000-0000-0000-000000000002', 
    '01-2026', '2026-01-08', 8000000.00, 'Transfer Mandiri', v_user_id, 'Pembayaran Januari + Titip Saldo Rp 1 Juta'
  );

  -- 3. Rahmat Hidayat (Ruko A03) - Tagihan Rp 8.000.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000003', 'k0000001-0000-0000-0000-000000000003', 
    '01-2026', '2026-01-14', 8000000.00, 'Transfer BCA', v_user_id, 'Lunas Januari'
  );

  -- 4. Dr. Amanda (Ruko A04) - Tagihan Rp 8.500.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000004', 'k0000001-0000-0000-0000-000000000004', 
    '01-2026', '2026-01-05', 8500000.00, 'Transfer BRI', v_user_id, 'Lunas Januari'
  );

  -- 5. Hendra Laundry (Kios B01) - Tagihan Rp 3.500.000 - Dicicil / Sebagian Rp 2.000.000
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000005', 'k0000001-0000-0000-0000-000000000005', 
    '01-2026', '2026-01-10', 2000000.00, 'Tunai', v_user_id, 'Cicilan 1 Januari 2026'
  );

  -- 6. Siska Hijab (Kios B02) - Tagihan Rp 3.500.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000006', 'k0000001-0000-0000-0000-000000000006', 
    '01-2026', '2026-01-09', 3500000.00, 'Transfer QRIS', v_user_id, 'Lunas Januari'
  );

  -- 7. Agus Prayitno (Kios B03) - Tagihan Rp 3.000.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000007', 'k0000001-0000-0000-0000-000000000007', 
    '01-2026', '2026-01-15', 3000000.00, 'Transfer BCA', v_user_id, 'Lunas Januari'
  );

  -- 8. Dewi Apotek (Kios B04) - Belum bayar di Januari (Menunggak)

  -- 9. Gito Servis HP (Kios B05 Kontrak Lama) - Tagihan Rp 2.800.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000015', 'k0000001-0000-0000-0000-000000000009', 
    '01-2026', '2026-01-10', 2800000.00, 'Tunai', v_user_id, 'Lunas Januari'
  );

  -- 10. Maya Kusuma (Kost C01) - Tagihan Rp 2.200.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000010', 'k0000001-0000-0000-0000-000000000010', 
    '01-2026', '2026-01-01', 2200000.00, 'Transfer Mandiri', v_user_id, 'Lunas Kost Jan'
  );

  -- 11. Fajar Ramadhan (Kost C02) - Tagihan Rp 2.200.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000011', 'k0000001-0000-0000-0000-000000000011', 
    '01-2026', '2026-01-05', 2200000.00, 'Transfer BCA', v_user_id, 'Lunas Kost Jan'
  );

  -- 12. Nadia Utami (Kost C03) - Tagihan Rp 2.200.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000012', 'k0000001-0000-0000-0000-000000000012', 
    '01-2026', '2026-01-04', 2200000.00, 'Transfer Jenius', v_user_id, 'Lunas Kost Jan'
  );

  -- 13. Reza Lawfirm (Kantor D01) - Tagihan Rp 5.500.000 - Bayar Tepat Waktu
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000013', 'k0000001-0000-0000-0000-000000000013', 
    '01-2026', '2026-01-01', 5500000.00, 'Transfer BCA', v_user_id, 'Lunas Sewa Kantor Jan'
  );


  -- ===============================================================================
  -- FEBRUARI 2026
  -- ===============================================================================
  -- Catatan: Saat generate_tagihan_periode '02-2026', sistem otomatis memakai
  -- saldo titipan Hj Salmah (Rp 1.000.000) untuk memotong tagihan Feb!
  v_res := generate_tagihan_periode('02-2026', v_user_id);

  -- Pembayaran Februari
  
  -- 1. Bambang Sudarsono (Ruko A01) - Lunas
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', 
    '02-2026', '2026-02-05', 7500000.00, 'Transfer BCA', v_user_id, 'Lunas Feb'
  );

  -- 2. Hj Salmah (Ruko A02) - Tagihan Rp 7.500.000 terpotong deposit Rp 1.000.000 = Sisa Rp 6.500.000 dibayar Lunas
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000002', 'k0000001-0000-0000-0000-000000000002', 
    '02-2026', '2026-02-10', 6500000.00, 'Transfer Mandiri', v_user_id, 'Pelunasan sisa tagihan Feb'
  );

  -- 3. Hendra Laundry - Pelunasan Tunggakan Jan (Rp 1.500.000) + Feb (Rp 3.500.000) via FIFO
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000005', 'k0000001-0000-0000-0000-000000000005', 
    '02-2026', '2026-02-12', 5000000.00, 'Transfer BCA', v_user_id, 'Bayar tunggakan Jan & Feb Lunas via FIFO'
  );

  -- 4. Dewi Apotek - Bayar FIFO 2 Bulan Sekaligus (Jan Rp 2.500.000 + Feb Rp 2.500.000)
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000008', 'k0000001-0000-0000-0000-000000000008', 
    '02-2026', '2026-02-22', 5000000.00, 'Transfer Mandiri', v_user_id, 'Pelunasan Jan & Feb'
  );

  -- 5. Fitri Boba (Kios B06) - Penyewa Baru Feb - Lunas
  PERFORM proses_pembayaran_fifo(
    'p0000001-0000-0000-0000-000000000014', 'k0000001-0000-0000-0000-000000000014', 
    '02-2026', '2026-02-10', 2800000.00, 'Transfer BCA', v_user_id, 'Lunas Feb'
  );

  -- 6. Gito Servis (Kios B05) - Mulai menunggak di Feb!

  -- Penyewa kost & kantor rutin lunas
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000010', 'k0000001-0000-0000-0000-000000000010', '02-2026', '2026-02-01', 2200000.00, 'Transfer Mandiri', v_user_id, 'Lunas');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000011', 'k0000001-0000-0000-0000-000000000011', '02-2026', '2026-02-05', 2200000.00, 'Transfer BCA', v_user_id, 'Lunas');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000013', 'k0000001-0000-0000-0000-000000000013', '02-2026', '2026-02-01', 5500000.00, 'Transfer BCA', v_user_id, 'Lunas');


  -- ===============================================================================
  -- MARET 2026 (Promo Ramadhan Berkah 10% Diskon Aktif)
  -- ===============================================================================
  v_res := generate_tagihan_periode('03-2026', v_user_id);

  -- Pembayaran Maret
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', '03-2026', '2026-03-05', 7500000.00, 'Transfer BCA', v_user_id, 'Lunas Maret');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000002', 'k0000001-0000-0000-0000-000000000002', '03-2026', '2026-03-09', 7500000.00, 'Transfer Mandiri', v_user_id, 'Lunas Maret');
  
  -- Hendra Laundry dapat Promo Ramadhan 10% (Tagihan Rp 3.150.000) - Bayar Lunas
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000005', 'k0000001-0000-0000-0000-000000000005', '03-2026', '2026-03-10', 3150000.00, 'Transfer BCA', v_user_id, 'Lunas Maret Promo Ramadhan');
  
  -- Gito Servis (Kios B05) menunggak lagi di Maret (Tunggakan 2 Bulan: Feb & Mar)


  -- ===============================================================================
  -- APRIL 2026
  -- ===============================================================================
  v_res := generate_tagihan_periode('04-2026', v_user_id);

  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', '04-2026', '2026-04-05', 7500000.00, 'Transfer BCA', v_user_id, 'Lunas April');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000002', 'k0000001-0000-0000-0000-000000000002', '04-2026', '2026-04-08', 7500000.00, 'Transfer Mandiri', v_user_id, 'Lunas April');

  -- Gito Servis (Kios B05) kabur/batal, menunggak Feb, Mar, Apr. 
  -- Manajemen memutuskan Write-Off untuk 1 Tagihan Terparah & Mengakhiri Kontrak!


  -- ===============================================================================
  -- MEI 2026
  -- ===============================================================================
  v_res := generate_tagihan_periode('05-2026', v_user_id);

  -- Executing Write-Off untuk salah satu tagihan macet Gito Servis B05
  DECLARE
    v_tagihan_bad_id UUID;
  BEGIN
    SELECT id_tagihan INTO v_tagihan_bad_id FROM tagihan WHERE id_kontrak = 'k0000001-0000-0000-0000-000000000009' AND periode = '02-2026';
    IF v_tagihan_bad_id IS NOT NULL THEN
      PERFORM write_off_tagihan(v_tagihan_bad_id, v_user_id, 'Penyewa tutup usaha dan tidak bisa dihubungi');
    END IF;
  END;

  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', '05-2026', '2026-05-05', 7200000.00, 'Transfer BCA', v_user_id, 'Lunas Mei (Dipotong Loyalty Promo Rp 300k)');


  -- ===============================================================================
  -- JUNI 2026
  -- ===============================================================================
  v_res := generate_tagihan_periode('06-2026', v_user_id);

  -- Pembayaran Juni
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', '06-2026', '2026-06-04', 7200000.00, 'Transfer BCA', v_user_id, 'Lunas Juni');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000002', 'k0000001-0000-0000-0000-000000000002', '06-2026', '2026-06-10', 7500000.00, 'Transfer Mandiri', v_user_id, 'Lunas Juni');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000024', 'k0000001-0000-0000-0000-000000000022', '06-2026', '2026-06-15', 2800000.00, 'Transfer QRIS', v_user_id, 'Lunas Kios B05 Penyewa Baru (Aris Gym)');


  -- ===============================================================================
  -- JULI 2026 (PERIODE BERJALAN)
  -- ===============================================================================
  v_res := generate_tagihan_periode('07-2026', v_user_id);

  -- Beberapa pembayaran Juli sudah masuk
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000001', 'k0000001-0000-0000-0000-000000000001', '07-2026', '2026-07-05', 7200000.00, 'Transfer BCA', v_user_id, 'Lunas Juli');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000004', 'k0000001-0000-0000-0000-000000000004', '07-2026', '2026-07-05', 8500000.00, 'Transfer BRI', v_user_id, 'Lunas Juli');
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000010', 'k0000001-0000-0000-0000-000000000010', '07-2026', '2026-07-01', 2200000.00, 'Transfer Mandiri', v_user_id, 'Lunas Kost Juli');
  
  -- Pembayaran sebagian untuk Juli
  PERFORM proses_pembayaran_fifo('p0000001-0000-0000-0000-000000000003', 'k0000001-0000-0000-0000-000000000003', '07-2026', '2026-07-16', 4000000.00, 'Transfer BCA', v_user_id, 'Pembayaran Sebagian Ruko A03 Juli');

END $$;

-- Update status tagihan yang sudah terlewat jatuh tempo menjadi 'Terlambat'
UPDATE tagihan 
SET status_tagihan = 'Terlambat' 
WHERE status_tagihan = 'Belum Bayar' 
  AND jatuh_tempo < CURRENT_DATE;

-- ---------------------------------------------------------------------------------
-- 7. AUDIT LOGS & LOG WHATSAPP (Aktivitas Sistem Realistis)
-- ---------------------------------------------------------------------------------
INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_baru, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Owner', 'Setup Sistem & Unit', 'unit', '40 Unit', '{"info": "Inisialisasi 40 unit Ruko, Kios, Kost, Kantor"}', '2025-12-10 09:00:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Input Penyewa Baru', 'penyewa', '25 Penyewa', '{"count": 25, "status": "Lengkap dengan KTP & Kontak Darurat"}', '2025-12-20 11:30:00+07'),
  ('11111111-1111-1111-1111-111111111111', 'Owner', 'Buat Promo Tahun Baru', 'promo', 'pr000001-0000-0000-0000-000000000001', '{"nama": "Diskon Tahun Baru 2026", "potongan": 500000}', '2025-12-25 14:00:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Generate Tagihan 01-2026', 'tagihan', '01-2026', '{"periode": "01-2026", "total_tagihan_dibuat": 13}', '2026-01-01 00:01:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Generate Tagihan 02-2026', 'tagihan', '02-2026', '{"periode": "02-2026", "alokasi_deposit_otomatis": true}', '2026-02-01 00:01:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Generate Tagihan 03-2026', 'tagihan', '03-2026', '{"periode": "03-2026", "promo_ramadhan_applied": true}', '2026-03-01 00:01:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Kirim Reminder WA Massal', 'log_wa_tagihan', 'WA-20260315', '{"penerima": 4, "status": "Sent"}', '2026-03-15 10:00:00+07'),
  ('11111111-1111-1111-1111-111111111111', 'Owner', 'Write Off Tagihan Macet', 'tagihan', 'k0000001-0000-0000-0000-000000000009', '{"catatan": "Write off Kios B05 tgl 02-2026"}', '2026-05-10 16:20:00+07'),
  ('22222222-2222-2222-2222-222222222222', 'Admin', 'Generate Tagihan 07-2026', 'tagihan', '07-2026', '{"periode": "07-2026", "total_unit_aktif": 23}', '2026-07-01 00:01:00+07');

-- Log Pengiriman Reminder WA Tagihan
INSERT INTO log_wa_tagihan (id_penyewa, id_user, tanggal_kirim, jumlah_tagihan_dilampirkan, total_piutang_wa, status_kirim, pesan_error) VALUES
  ('p0000001-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', '2026-02-15 09:30:00+07', 2, 5000000.00, 'Berhasil', NULL),
  ('p0000001-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222222', '2026-03-15 10:00:00+07', 2, 5600000.00, 'Berhasil', NULL),
  ('p0000001-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222222', '2026-04-15 10:00:00+07', 3, 8400000.00, 'Gagal', 'Nomor WhatsApp tidak aktif / diluar jangkauan'),
  ('p0000001-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '2026-07-20 09:00:00+07', 1, 4000000.00, 'Berhasil', NULL);

COMMIT;
