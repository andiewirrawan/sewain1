-- =================================================================================
-- SEWAIN Real-World Dummy Data (Jan 2026 - July 2026)
-- =================================================================================

BEGIN;

-- 1. PROMO DATA (3 Promos)
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi) VALUES
('p0000000-0000-0000-0000-000000000001', 'Early Bird 2026', 'Persen', 10.00, '2026-01-01', '2026-03-31', 'Aktif', 'Diskon 10% untuk penyewa yang masuk di Q1.'),
('p0000000-0000-0000-0000-000000000002', 'Ramadan Kareem', 'Nominal', 200000.00, '2026-03-01', '2026-04-30', 'Tidak Aktif', 'Potongan 200rb selama bulan Ramadan.'),
('p0000000-0000-0000-0000-000000000003', 'Mid Year Sale', 'Nominal', 500000.00, '2026-06-01', '2026-08-31', 'Aktif', 'Potongan 500rb untuk sewa minimal 6 bulan.');

-- 2. UNIT DATA (15 Units)
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit) VALUES
('u0000000-0000-0000-0000-000000000001', 'R-01', 'Ruko', 'A', '01', 5000000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000002', 'R-02', 'Ruko', 'A', '02', 5000000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000003', 'R-03', 'Ruko', 'B', '03', 6500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000004', 'K-01', 'Kios', 'Small', '01', 1500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000005', 'K-02', 'Kios', 'Small', '02', 1500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000006', 'K-03', 'Kios', 'Large', '03', 2500000.00, 'Kosong'),
('u0000000-0000-0000-0000-000000000007', 'K-04', 'Kios', 'Large', '04', 2500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000008', 'T-01', 'Kost', 'VIP', '101', 3500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000009', 'T-02', 'Kost', 'VIP', '102', 3500000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000010', 'T-03', 'Kost', 'Standard', '201', 1200000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000011', 'T-04', 'Kost', 'Standard', '202', 1200000.00, 'Kosong'),
('u0000000-0000-0000-0000-000000000012', 'T-05', 'Kost', 'Standard', '203', 1200000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000013', 'T-06', 'Kost', 'Standard', '204', 1200000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000014', 'O-01', 'Office', 'Co-working', 'A1', 8000000.00, 'Terisi'),
('u0000000-0000-0000-0000-000000000015', 'O-02', 'Office', 'Executive', 'B1', 12000000.00, 'Kosong');

-- 3. PENYEWA DATA (12 Penyewa)
INSERT INTO penyewa (id_penyewa, nama, nik, alamat, whatsapp, kontak_darurat, jenis_usaha) VALUES
('s0000000-0000-0000-0000-000000000001', 'Budi Santoso', '3201010101010001', 'Jakarta', '6281234567890', 'Istri - 0812', 'F&B'),
('s0000000-0000-0000-0000-000000000002', 'Ani Wijaya', '3201010101010002', 'Bandung', '6281234567891', 'Ayah - 0813', 'Retail'),
('s0000000-0000-0000-0000-000000000003', 'PT Maju Terus', '3201010101010003', 'Gedung Cyber', '6281234567892', 'Admin - 0814', 'IT'),
('s0000000-0000-0000-0000-000000000004', 'Citra Lestari', '3201010101010004', 'Depok', '6281234567893', 'Ibu - 0815', 'Kecantikan'),
('s0000000-0000-0000-0000-000000000005', 'Dedi Kurniawan', '3201010101010005', 'Bekasi', '6281234567894', 'Adik - 0816', 'Pribadi'),
('s0000000-0000-0000-0000-000000000006', 'Eka Putri', '3201010101010006', 'Bogor', '6281234567895', 'Suami - 0817', 'Pribadi'),
('s0000000-0000-0000-0000-000000000007', 'Fajar Ramadhan', '3201010101010007', 'Tangerang', '6281234567896', 'Kakak - 0818', 'Jasa'),
('s0000000-0000-0000-0000-000000000008', 'Gita Gutawa', '3201010101010008', 'Jakarta Selatan', '6281234567897', 'Manager - 0819', 'Pribadi'),
('s0000000-0000-0000-0000-000000000009', 'Hendra Setiawan', '3201010101010009', 'Cimahi', '6281234567898', 'Istri - 0820', 'Olahraga'),
('s0000000-0000-0000-0000-000000000010', 'Indah Permata', '3201010101010010', 'Surabaya', '6281234567899', 'Ibu - 0821', 'E-commerce'),
('s0000000-0000-0000-0000-000000000011', 'Joko Susilo', '3201010101010011', 'Solo', '6281234567800', 'Anak - 0822', 'Kuliner'),
('s0000000-0000-0000-0000-000000000012', 'Kiki Amelia', '3201010101010012', 'Semarang', '6281234567801', 'Sahabat - 0823', 'Fashion');

-- 4. KONTRAK SEWA (12 Kontrak)
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_keluar, tanggal_jatuh_tempo, status_kontrak) VALUES
-- Aktif sejak awal tahun
('k0000000-0000-0000-0000-000000000001', 'KTR-2026-001', 'u0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('k0000000-0000-0000-0000-000000000002', 'KTR-2026-002', 'u0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', '2026-01-01', '2026-12-31', 10, 'Aktif'),
('k0000000-0000-0000-0000-000000000003', 'KTR-2026-003', 'u0000000-0000-0000-0000-000000000014', 's0000000-0000-0000-0000-000000000003', '2026-01-01', '2026-12-31', 1, 'Aktif'),
-- Masuk di tengah jalan
('k0000000-0000-0000-0000-000000000004', 'KTR-2026-004', 'u0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004', '2026-02-01', '2027-01-31', 5, 'Aktif'),
('k0000000-0000-0000-0000-000000000005', 'KTR-2026-005', 'u0000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000005', '2026-03-01', '2026-08-31', 15, 'Aktif'),
-- Selesai/Pindah Keluar (Unit R-03)
('k0000000-0000-0000-0000-000000000006', 'KTR-2026-006', 'u0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000006', '2026-01-01', '2026-04-30', 5, 'Selesai'),
('k0000000-0000-0000-0000-000000000007', 'KTR-2026-007', 'u0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000007', '2026-05-15', '2027-05-14', 20, 'Aktif'), -- Pengganti di unit R-03
-- Lainnya
('k0000000-0000-0000-0000-000000000008', 'KTR-2026-008', 'u0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000008', '2026-04-01', '2026-10-31', 5, 'Aktif'),
('k0000000-0000-0000-0000-000000000009', 'KTR-2026-009', 'u0000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000009', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('k0000000-0000-0000-0000-000000000010', 'KTR-2026-010', 'u0000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000010', '2026-05-01', '2026-12-31', 10, 'Aktif'),
('k0000000-0000-0000-0000-000000000011', 'KTR-2026-011', 'u0000000-0000-0000-0000-000000000012', 's0000000-0000-0000-0000-000000000011', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('k0000000-0000-0000-0000-000000000012', 'KTR-2026-012', 'u0000000-0000-0000-0000-000000000013', 's0000000-0000-0000-0000-000000000012', '2026-06-01', '2027-05-31', 10, 'Aktif');

-- 5. TAGIHAN & PEMBAYARAN (Jan - July Simulation)
-- Manual entries to ensure realistic dates and FIFO links

-- --- JANUARI 2026 ---
-- Budi Santoso (K001): Lunas Tepat Waktu
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202601-001', 'k0000000-0000-0000-0000-000000000001', '01-2026', '2026-01-05', 5000000, 5000000, 5000000, 'Lunas');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202601-001', 'k0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', '01-2026', '2026-01-04', 5000000, 'Transfer BCA');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES ('pay202601-001', 't202601-001', 5000000);

-- PT Maju Terus (K003): Lunas Cepat
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202601-003', 'k0000000-0000-0000-0000-000000000003', '01-2026', '2026-01-01', 8000000, 8000000, 8000000, 'Lunas');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202601-003', 'k0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', '01-2026', '2025-12-30', 8000000, 'Transfer Mandiri');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES ('pay202601-003', 't202601-003', 8000000);

-- --- FEBRUARI 2026 ---
-- Ani Wijaya (K002): Jan & Feb dibayar sekaligus di Feb
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202601-002', 'k0000000-0000-0000-0000-000000000002', '01-2026', '2026-01-10', 5000000, 5000000, 5000000, 'Lunas'),
       ('t202602-002', 'k0000000-0000-0000-0000-000000000002', '02-2026', '2026-02-10', 5000000, 5000000, 5000000, 'Lunas');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202602-002', 'k0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', '02-2026', '2026-02-12', 10000000, 'Transfer BCA');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) 
VALUES ('pay202602-002', 't202601-002', 5000000),
       ('pay202602-002', 't202602-002', 5000000);

-- --- MARET 2026 ---
-- Citra Lestari (K004): Bayar Sebagian (Partial)
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202602-004', 'k0000000-0000-0000-0000-000000000004', '02-2026', '2026-02-05', 1500000, 1500000, 1500000, 'Lunas'),
       ('t202603-004', 'k0000000-0000-0000-0000-000000000004', '03-2026', '2026-03-05', 1500000, 1500000, 500000, 'Sebagian');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202602-004', 'k0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004', '02-2026', '2026-02-05', 1500000, 'Tunai'),
       ('pay202603-004', 'k0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004', '03-2026', '2026-03-20', 500000, 'Tunai');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) 
VALUES ('pay202602-004', 't202602-004', 1500000),
       ('pay202603-004', 't202603-004', 500000);

-- --- MEI 2026 ---
-- Budi Santoso: Ada tagihan Belum Bayar (Menunggak)
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202605-001', 'k0000000-0000-0000-0000-000000000001', '05-2026', '2026-05-05', 5000000, 5000000, 0, 'Belum Bayar');

-- --- JUNI 2026 ---
-- Hendra Setiawan (K009): Diskon Promo
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202606-009', 'k0000000-0000-0000-0000-000000000009', '06-2026', '2026-06-05', 2500000, 'p0000000-0000-0000-0000-000000000003', 500000, 2000000, 2000000, 'Lunas');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202606-009', 'k0000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000009', '06-2026', '2026-06-06', 2000000, 'Qris');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES ('pay202606-009', 't202606-009', 2000000);

-- --- JULI 2026 ---
-- General Bills for July
INSERT INTO tagihan (id_tagihan, id_kontrak, periode, jatuh_tempo, nominal_tagihan, total_tagihan, terbayar, status_tagihan) 
VALUES ('t202607-001', 'k0000000-0000-0000-0000-000000000001', '07-2026', '2026-07-05', 5000000, 5000000, 0, 'Belum Bayar'),
       ('t202607-003', 'k0000000-0000-0000-0000-000000000003', '07-2026', '2026-07-01', 8000000, 8000000, 8000000, 'Lunas');
INSERT INTO pembayaran (id_pembayaran, id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran) 
VALUES ('pay202607-003', 'k0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', '07-2026', '2026-07-02', 8000000, 'Transfer Mandiri');
INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES ('pay202607-003', 't202607-003', 8000000);

-- 6. AUDIT LOG (Chronological Activities)
INSERT INTO audit_log (id_user, role, aktivitas, nama_tabel, id_data, data_baru) VALUES
('11111111-1111-1111-1111-111111111111', 'System Owner', 'Setup Master Data Units', 'unit', 'ALL', '{"count": 15}'),
('33333333-3333-3333-3333-333333333333', 'Admin', 'Create New Contract KTR-2026-001', 'kontrak_sewa', 'k0000000-0000-0000-0000-000000000001', '{"status": "Aktif"}'),
('44444444-4444-4444-4444-444444444444', 'Kasir', 'Record Payment pay202601-001', 'pembayaran', 'pay202601-001', '{"nominal": 5000000}'),
('33333333-3333-3333-3333-333333333333', 'Admin', 'Change Contract Status KTR-2026-006 to Selesai', 'kontrak_sewa', 'k0000000-0000-0000-0000-000000000006', '{"status_kontrak": "Selesai"}'),
('44444444-4444-4444-4444-444444444444', 'Kasir', 'Partial Payment for Citra Lestari', 'pembayaran', 'pay202603-004', '{"nominal": 500000}');

COMMIT;
