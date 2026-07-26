-- =================================================================================
-- SEWAIN Project Seed Data (Production Simulation)
-- =================================================================================

BEGIN;

-- 1. USERS (Password: password123)
-- Hash generated via bcrypt
INSERT INTO users (id, nama, email, password, role, is_system_owner, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Super Admin', 'system@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'System Owner', true, 'Aktif'),
('22222222-2222-2222-2222-222222222222', 'Andie Owner', 'owner@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Owner', false, 'Aktif'),
('33333333-3333-3333-3333-333333333333', 'Budi Admin', 'admin@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Admin', false, 'Aktif'),
('44444444-4444-4444-4444-444444444444', 'Siti Kasir', 'kasir@sewain.com', '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', 'Kasir', false, 'Aktif');

-- 2. UNIT PROPERTI
INSERT INTO unit (id_unit, kode_unit, kategori, jenis_unit, nomor_unit, harga_sewa, status_unit) VALUES
('c1c1c1c1-0000-0000-0000-000000000001', 'A01', 'Ruko', 'Type A', 'A01', 7500000.00, 'Kosong'),
('c1c1c1c1-0000-0000-0000-000000000002', 'A02', 'Ruko', 'Type A', 'A02', 7500000.00, 'Kosong'),
('c1c1c1c1-0000-0000-0000-000000000003', 'A03', 'Ruko', 'Type B', 'A03', 8000000.00, 'Kosong'),
('c2c2c2c2-0000-0000-0000-000000000001', 'B01', 'Kios', 'Kios Kecil', 'B01', 2500000.00, 'Kosong'),
('c2c2c2c2-0000-0000-0000-000000000002', 'B02', 'Kios', 'Kios Kecil', 'B02', 2500000.00, 'Kosong'),
('c3c3c3c3-0000-0000-0000-000000000001', 'C01', 'Kost', 'Kost VIP', 'C01', 3500000.00, 'Kosong');

-- 3. PENYEWA
INSERT INTO penyewa (id_penyewa, nama, nik, alamat, email, whatsapp, kontak_darurat, jenis_usaha) VALUES
('bbbbbbbb-0000-0000-0000-000000000001', 'Bambang Kopi', '3201010101010001', 'Jl. Merdeka No. 1', 'bambang@kopi.com', '628123456789', 'Istri - 08123456788', 'F&B'),
('bbbbbbbb-0000-0000-0000-000000000002', 'Hj Salmah', '3201010101010002', 'Jl. Sudirman No. 10', 'salmah@pasar.com', '628121122334', 'Anak - 08121122335', 'Sembako'),
('bbbbbbbb-0000-0000-0000-000000000003', 'Hendra Laundry', '3201010101010003', 'Jl. Gatot Subroto No. 5', 'hendra@laundry.com', '628134455667', 'Adik - 08134455668', 'Jasa');

-- 4. PROMO
INSERT INTO promo (id_promo, nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi) VALUES
('dddddddd-0000-0000-0000-000000000001', 'Promo Grand Opening', 'Nominal', 500000.00, '2026-01-01', '2026-12-31', 'Aktif', 'Potongan 500rb untuk semua unit ruko.');

-- 5. KONTRAK SEWA
INSERT INTO kontrak_sewa (id_kontrak, nomor_kontrak, id_unit, id_penyewa, tanggal_masuk, tanggal_keluar, tanggal_jatuh_tempo, status_kontrak) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', 'KTR/202601/001', 'c1c1c1c1-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '2026-01-01', '2026-12-31', 5, 'Aktif'),
('aaaaaaaa-0000-0000-0000-000000000002', 'KTR/202601/002', 'c1c1c1c1-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', '2026-01-01', '2026-12-31', 10, 'Aktif'),
('aaaaaaaa-0000-0000-0000-000000000003', 'KTR/202601/003', 'c2c2c2c2-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003', '2026-01-01', '2026-12-31', 5, 'Aktif');

-- Update status unit
UPDATE unit SET status_unit = 'Terisi' WHERE id_unit IN (SELECT id_unit FROM kontrak_sewa WHERE status_kontrak = 'Aktif');

-- 6. SIMULASI OPERASIONAL (JANUARI 2026)
DO $$
DECLARE
    v_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Generate Tagihan Januari 2026
    PERFORM generate_tagihan_periode('01-2026', v_user_id);

    -- Pembayaran Bambang Kopi (Lunas)
    PERFORM proses_pembayaran_fifo(
        'bbbbbbbb-0000-0000-0000-000000000001', 
        'aaaaaaaa-0000-0000-0000-000000000001', 
        '01-2026', 
        '2026-01-04', 
        7500000.00, 
        'Transfer BCA', 
        v_user_id, 
        'Lunas sewa Jan 2026'
    );

    -- Pembayaran Hj Salmah (Sebagian)
    PERFORM proses_pembayaran_fifo(
        'bbbbbbbb-0000-0000-0000-000000000002', 
        'aaaaaaaa-0000-0000-0000-000000000002', 
        '01-2026', 
        '2026-01-10', 
        4000000.00, 
        'Tunai', 
        v_user_id, 
        'Titip bayar 4jt dulu'
    );
END $$;

COMMIT;
