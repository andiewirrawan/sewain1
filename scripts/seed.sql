-- =================================================================================
-- SEWAIN Real-World Dummy Data (Jan 2026 - July 2026) - REFINED VERSION
-- =================================================================================

BEGIN;

-- 1. PROMO DATA (3 Promos)
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi) VALUES
('f1000000-0000-4000-a000-000000000001', 'Early Bird 2026', 'Persen', 10.00, '2026-01-01', '2026-03-31', 'Aktif', 'Diskon 10% untuk penyewa yang masuk di Q1.'),
('f1000000-0000-4000-a000-000000000002', 'Ramadan Kareem', 'Nominal', 200000.00, '2026-03-01', '2026-04-30', 'Tidak Aktif', 'Potongan 200rb selama bulan Ramadan.'),
('f1000000-0000-4000-a000-000000000003', 'Mid Year Sale', 'Nominal', 500000.00, '2026-06-01', '2026-08-31', 'Aktif', 'Potongan 500rb untuk sewa minimal 6 bulan.');

-- 2. UNIT DATA (15 Units)
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit) VALUES
('f2000000-0000-4000-a000-000000000001', 'R-01', 'Ruko', 'A', '01', 5000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000002', 'R-02', 'Ruko', 'A', '02', 5000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000003', 'R-03', 'Ruko', 'B', '03', 6500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000004', 'K-01', 'Kios', 'Small', '01', 1500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000005', 'K-02', 'Kios', 'Small', '02', 1500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000006', 'K-03', 'Kios', 'Large', '03', 2500000.00, 'Kosong'),
('f2000000-0000-4000-a000-000000000007', 'K-04', 'Kios', 'Large', '04', 2500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000008', 'T-01', 'Kost', 'VIP', '101', 3500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000009', 'T-02', 'Kost', 'VIP', '102', 3500000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000010', 'T-03', 'Kost', 'Standard', '201', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000011', 'T-04', 'Kost', 'Standard', '202', 1200000.00, 'Kosong'),
('f2000000-0000-4000-a000-000000000012', 'T-05', 'Kost', 'Standard', '203', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000013', 'T-06', 'Kost', 'Standard', '204', 1200000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000014', 'O-01', 'Office', 'Co-working', 'A1', 8000000.00, 'Terisi'),
('f2000000-0000-4000-a000-000000000015', 'O-02', 'Office', 'Executive', 'B1', 12000000.00, 'Kosong');

-- 3. PENYEWA DATA (12 Penyewa)
INSERT INTO penyewa (id_penyewa, nama, nik, alamat, whatsapp, kontak_darurat, jenis_usaha) VALUES
('f3000000-0000-4000-a000-000000000001', 'Budi Santoso', '3201010101010001', 'Jakarta', '6281234567890', 'Istri - 0812', 'F&B'),
('f3000000-0000-4000-a000-000000000002', 'Ani Wijaya', '3201010101010002', 'Bandung', '6281234567891', 'Ayah - 0813', 'Retail'),
('f3000000-0000-4000-a000-000000000003', 'PT Maju Terus', '3201010101010003', 'Gedung Cyber', '6281234567892', 'Admin - 0814', 'IT'),
('f3000000-0000-4000-a000-000000000004', 'Citra Lestari', '3201010101010004', 'Depok', '6281234567893', 'Ibu - 0815', 'Kecantikan'),
('f3000000-0000-4000-a000-000000000005', 'Dedi Kurniawan', '3201010101010005', 'Bekasi', '6281234567894', 'Adik - 0816', 'Pribadi'),
('f3000000-0000-4000-a000-000000000006', 'Eka Putri', '3201010101010006', 'Bogor', '6281234567895', 'Suami - 0817', 'Pribadi'),
('f3000000-0000-4000-a000-000000000007', 'Fajar Ramadhan', '3201010101010007', 'Tangerang', '6281234567896', 'Kakak - 0818', 'Jasa'),
('f3000000-0000-4000-a000-000000000008', 'Gita Gutawa', '3201010101010008', 'Jakarta Selatan', '6281234567897', 'Manager - 0819', 'Pribadi'),
('f3000000-0000-4000-a000-000000000009', 'Hendra Setiawan', '3201010101010009', 'Cimahi', '6281234567898', 'Istri - 0820', 'Olahraga'),
('f3000000-0000-4000-a000-000000000010', 'Indah Permata', '3201010101010010', 'Surabaya', '6281234567899', 'Ibu - 0821', 'E-commerce'),
('f3000000-0000-4000-a000-000000000011', 'Joko Susilo', '3201010101010011', 'Solo', '6281234567800', 'Anak - 0822', 'Kuliner'),
('f3000000-0000-4000-a000-000000000012', 'Kiki Amelia', '3201010101010012', 'Semarang', '6281234567801', 'Sahabat - 0823', 'Fashion');

-- 4. KONTRAK SEWA (12 Kontrak)
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_keluar, tanggal_jatuh_tempo, status_kontrak) VALUES
('f4000000-0000-4000-a000-000000000001', 'KTR-2026-001', 'f2000000-0000-4000-a000-000000000001', 'f3000000-0000-4000-a000-000000000001', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000002', 'KTR-2026-002', 'f2000000-0000-4000-a000-000000000002', 'f3000000-0000-4000-a000-000000000002', '2026-01-01', '2026-12-31', 10, 'Aktif'),
('f4000000-0000-4000-a000-000000000003', 'KTR-2026-003', 'f2000000-0000-4000-a000-000000000014', 'f3000000-0000-4000-a000-000000000003', '2026-01-01', '2026-12-31', 1, 'Aktif'),
('f4000000-0000-4000-a000-000000000004', 'KTR-2026-004', 'f2000000-0000-4000-a000-000000000004', 'f3000000-0000-4000-a000-000000000004', '2026-02-01', '2027-01-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000005', 'KTR-2026-005', 'f2000000-0000-4000-a000-000000000008', 'f3000000-0000-4000-a000-000000000005', '2026-03-01', '2026-08-31', 15, 'Aktif'),
('f4000000-0000-4000-a000-000000000006', 'KTR-2026-006', 'f2000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000006', '2026-01-01', '2026-04-30', 5, 'Selesai'),
('f4000000-0000-4000-a000-000000000007', 'KTR-2026-007', 'f2000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000007', '2026-05-15', '2027-05-14', 20, 'Aktif'),
('f4000000-0000-4000-a000-000000000008', 'KTR-2026-008', 'f2000000-0000-4000-a000-000000000005', 'f3000000-0000-4000-a000-000000000008', '2026-04-01', '2026-10-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000009', 'KTR-2026-009', 'f2000000-0000-4000-a000-000000000007', 'f3000000-0000-4000-a000-000000000009', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000010', 'KTR-2026-010', 'f2000000-0000-4000-a000-000000000009', 'f3000000-0000-4000-a000-000000000010', '2026-05-01', '2026-12-31', 10, 'Aktif'),
('f4000000-0000-4000-a000-000000000011', 'KTR-2026-011', 'f2000000-0000-4000-a000-000000000012', 'f3000000-0000-4000-a000-000000000011', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('f4000000-0000-4000-a000-000000000012', 'KTR-2026-012', 'f2000000-0000-4000-a000-000000000013', 'f3000000-0000-4000-a000-000000000012', '2026-06-01', '2027-05-31', 10, 'Aktif');

-- 5. TAGIHAN & PEMBAYARAN (Jan - July Simulation)

-- JANUARI 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001', '01-2026', '2026-01-05', 5000000, 5000000, 5000000, 'Lunas'),
('f5000000-0000-4000-a000-000000000003', 'f4000000-0000-4000-a000-000000000003', '01-2026', '2026-01-01', 8000000, 8000000, 8000000, 'Lunas');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000001', 'f4000000-0000-4000-a000-000000000001', 'f3000000-0000-4000-a000-000000000001', '01-2026', '2026-01-04', 5000000, 'Transfer BCA'),
('f6000000-0000-4000-a000-000000000003', 'f4000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000003', '01-2026', '2025-12-30', 8000000, 'Transfer Mandiri');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000001', 'f5000000-0000-4000-a000-000000000001', 5000000),
('f6000000-0000-4000-a000-000000000003', 'f5000000-0000-4000-a000-000000000003', 8000000);

-- FEBRUARI 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000002', 'f4000000-0000-4000-a000-000000000002', '01-2026', '2026-01-10', 5000000, 5000000, 5000000, 'Lunas'),
('f5000000-0000-4000-a000-000000000004', 'f4000000-0000-4000-a000-000000000002', '02-2026', '2026-02-10', 5000000, 5000000, 5000000, 'Lunas');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000002', 'f4000000-0000-4000-a000-000000000002', 'f3000000-0000-4000-a000-000000000002', '02-2026', '2026-02-12', 10000000, 'Transfer BCA');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000002', 'f5000000-0000-4000-a000-000000000002', 5000000),
('f6000000-0000-4000-a000-000000000002', 'f5000000-0000-4000-a000-000000000004', 5000000);

-- MARET 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000005', 'f4000000-0000-4000-a000-000000000004', '02-2026', '2026-02-05', 1500000, 1500000, 1500000, 'Lunas'),
('f5000000-0000-4000-a000-000000000006', 'f4000000-0000-4000-a000-000000000004', '03-2026', '2026-03-05', 1500000, 1500000, 500000, 'Sebagian');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000005', 'f4000000-0000-4000-a000-000000000004', 'f3000000-0000-4000-a000-000000000004', '02-2026', '2026-02-05', 1500000, 'Tunai'),
('f6000000-0000-4000-a000-000000000006', 'f4000000-0000-4000-a000-000000000004', 'f3000000-0000-4000-a000-000000000004', '03-2026', '2026-03-20', 500000, 'Tunai');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000005', 'f5000000-0000-4000-a000-000000000005', 1500000),
('f6000000-0000-4000-a000-000000000006', 'f5000000-0000-4000-a000-000000000006', 500000);

-- MEI 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000007', 'f4000000-0000-4000-a000-000000000001', '05-2026', '2026-05-05', 5000000, 5000000, 0, 'Belum Bayar');

-- JUNI 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000008', 'f4000000-0000-4000-a000-000000000009', '06-2026', '2026-06-05', 2500000, 'f1000000-0000-4000-a000-000000000003', 500000, 2000000, 2000000, 'Lunas');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000008', 'f4000000-0000-4000-a000-000000000009', 'f3000000-0000-4000-a000-000000000009', '06-2026', '2026-06-06', 2000000, 'Qris');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000008', 'f5000000-0000-4000-a000-000000000008', 2000000);

-- JULI 2026
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) VALUES 
('f5000000-0000-4000-a000-000000000009', 'f4000000-0000-4000-a000-000000000001', '07-2026', '2026-07-05', 5000000, 5000000, 0, 'Belum Bayar'),
('f5000000-0000-4000-a000-000000000010', 'f4000000-0000-4000-a000-000000000003', '07-2026', '2026-07-01', 8000000, 8000000, 8000000, 'Lunas');

INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) VALUES 
('f6000000-0000-4000-a000-000000000010', 'f4000000-0000-4000-a000-000000000003', 'f3000000-0000-4000-a000-000000000003', '07-2026', '2026-07-02', 8000000, 'Transfer Mandiri');

INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES 
('f6000000-0000-4000-a000-000000000010', 'f5000000-0000-4000-a000-000000000010', 8000000);

-- 6. AUDIT LOG (Chronological Activities) - USING CORRECT USER IDs
-- System Owner: 11111111-1111-1111-1111-111111111111
-- Owner: caf7d1dd-46f1-48c3-9807-c2662360af9e
-- Admin: 7ff7e514-183d-43f6-bc2a-7ce813ede100

INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_baru) VALUES
('11111111-1111-1111-1111-111111111111', 'System Owner', 'Setup Master Data Units', 'unit', 'ALL', '{"count": 15}'),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin', 'Create New Contract KTR-2026-001', 'kontrak_sewa', 'f4000000-0000-4000-a000-000000000001', '{"status": "Aktif"}'),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin', 'Record Payment f6000000-0000-4000-a000-000000000001', 'pembayaran', 'f6000000-0000-4000-a000-000000000001', '{"nominal": 5000000}'),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin', 'Change Contract Status KTR-2026-006 to Selesai', 'kontrak_sewa', 'f4000000-0000-4000-a000-000000000006', '{"status_kontrak": "Selesai"}'),
('7ff7e514-183d-43f6-bc2a-7ce813ede100', 'Admin', 'Partial Payment for Citra Lestari', 'pembayaran', 'f6000000-0000-4000-a000-000000000006', '{"nominal": 500000}');

COMMIT;
