-- SEWAIN Application Database Schema (FULL FIXED)
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
    id_kontrak UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_kontrak TEXT UNIQUE NOT NULL,
    id_unit UUID REFERENCES unit(id_unit) ON DELETE RESTRICT,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    tanggal_masuk DATE NOT NULL,
    tanggal_keluar DATE,
    tanggal_jatuh_tempo INT NOT NULL,
    status_kontrak TEXT DEFAULT 'Aktif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE promo (
    id_promo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_promo TEXT NOT NULL,
    jenis_diskon jenis_diskon_type NOT NULL,
    nilai_diskon NUMERIC(15,2) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    status promo_status_type DEFAULT 'Aktif',
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT check_persen_limit CHECK ((jenis_diskon = 'Persen' AND nilai_diskon <= 100) OR (jenis_diskon != 'Persen'))
);

CREATE TABLE promo_penyewa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_promo UUID REFERENCES promo(id_promo) ON DELETE CASCADE,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (id_promo, id_penyewa)
);

CREATE TABLE tagihan (
    id_tagihan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE CASCADE,
    periode TEXT NOT NULL,
    jatuh_tempo DATE NOT NULL,
    nominal_tagihan NUMERIC(15,2) NOT NULL,
    id_promo UUID REFERENCES promo(id_promo) ON DELETE SET NULL,
    nominal_diskon NUMERIC(15,2) DEFAULT 0,
    total_tagihan NUMERIC(15,2) NOT NULL,
    terbayar NUMERIC(15,2) DEFAULT 0,
    status_tagihan status_tagihan_type DEFAULT 'Belum Bayar',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(id_kontrak, periode)
);

CREATE TABLE pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kontrak UUID REFERENCES kontrak_sewa(id_kontrak) ON DELETE SET NULL,
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE SET NULL,
    periode TEXT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    nominal NUMERIC(15,2) NOT NULL,
    status_pembayaran TEXT DEFAULT 'Lunas',
    metode_pembayaran TEXT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE alokasi_pembayaran (
    id_alokasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembayaran UUID REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
    id_tagihan UUID REFERENCES tagihan(id_tagihan) ON DELETE CASCADE,
    nominal_alokasi NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE audit_log (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT NOT NULL,
    aktivitas TEXT NOT NULL,
    nama_tabel TEXT NOT NULL,
    id_data TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB
);

CREATE TABLE riwayat_generate_tagihan (
    id_generate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode TEXT NOT NULL,
    tanggal_generate TIMESTAMP WITH TIME ZONE DEFAULT now(),
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    jumlah_tagihan INTEGER DEFAULT 0,
    total_nominal NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Selesai'
);

CREATE TABLE log_wa_tagihan (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_penyewa UUID REFERENCES penyewa(id_penyewa) ON DELETE CASCADE,
    id_user UUID REFERENCES users(id) ON DELETE SET NULL,
    tanggal_kirim TIMESTAMP WITH TIME ZONE DEFAULT now(),
    jumlah_tagihan_dilampirkan INTEGER,
    total_piutang_wa NUMERIC(15,2),
    status_kirim TEXT DEFAULT 'Berhasil',
    pesan_error TEXT
);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION generate_tagihan_periode(p_periode TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    v_total NUMERIC(15,2) := 0;
    v_kontrak RECORD;
    v_id_tagihan UUID;
    v_nominal_tagihan NUMERIC(15,2);
    v_id_promo UUID;
    v_nilai_diskon NUMERIC(15,2);
    v_jenis_diskon jenis_diskon_type;
    v_nominal_diskon NUMERIC(15,2);
    v_total_tagihan NUMERIC(15,2);
    v_jatuh_tempo DATE;
    v_bulan INTEGER;
    v_tahun INTEGER;
    v_saldo_penyewa NUMERIC(15,2);
    v_alokasi_deposit NUMERIC(15,2);
    v_id_pembayaran UUID;
BEGIN
    v_bulan := split_part(p_periode, '-', 1)::INTEGER;
    v_tahun := split_part(p_periode, '-', 2)::INTEGER;

    FOR v_kontrak IN 
        SELECT k.*, u.harga_sewa
        FROM kontrak_sewa k
        JOIN unit u ON k.id_unit = u.id_unit
        WHERE k.status_kontrak = 'Aktif'
    LOOP
        IF EXISTS (SELECT 1 FROM tagihan WHERE id_kontrak = v_kontrak.id_kontrak AND periode = p_periode) THEN
            CONTINUE;
        END IF;

        v_nominal_tagihan := v_kontrak.harga_sewa;
        v_jatuh_tempo := make_date(v_tahun, v_bulan, LEAST(v_kontrak.tanggal_jatuh_tempo, 28));

        -- Promo check
        SELECT pr.id_promo, pr.nilai_diskon, pr.jenis_diskon INTO v_id_promo, v_nilai_diskon, v_jenis_diskon
        FROM promo pr JOIN promo_penyewa pp ON pr.id_promo = pp.id_promo
        WHERE pp.id_penyewa = v_kontrak.id_penyewa AND pr.status = 'Aktif' AND v_jatuh_tempo BETWEEN pr.tanggal_mulai AND pr.tanggal_selesai LIMIT 1;

        IF v_id_promo IS NOT NULL THEN
            IF v_jenis_diskon = 'Persen' THEN v_nominal_diskon := v_nominal_tagihan * (v_nilai_diskon / 100);
            ELSE v_nominal_diskon := v_nilai_diskon; END IF;
        ELSE v_nominal_diskon := 0; END IF;

        v_total_tagihan := GREATEST(v_nominal_tagihan - v_nominal_diskon, 0);

        INSERT INTO tagihan (id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan, status_tagihan)
        VALUES (v_kontrak.id_kontrak, p_periode, v_jatuh_tempo, v_nominal_tagihan, v_id_promo, v_nominal_diskon, v_total_tagihan, 'Belum Bayar')
        RETURNING id_tagihan INTO v_id_tagihan;

        v_count := v_count + 1;
        v_total := v_total + v_total_tagihan;

        -- Auto deposit
        SELECT saldo_titipan INTO v_saldo_penyewa FROM penyewa WHERE id_penyewa = v_kontrak.id_penyewa FOR UPDATE;
        IF v_saldo_penyewa > 0 THEN
            v_alokasi_deposit := LEAST(v_saldo_penyewa, v_total_tagihan);
            INSERT INTO pembayaran (id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran, catatan)
            VALUES (v_kontrak.id_kontrak, v_kontrak.id_penyewa, p_periode, CURRENT_DATE, v_alokasi_deposit, 'Saldo Titipan', 'Auto deposit');
            
            -- Simplified: update tagihan and penyewa
            UPDATE tagihan SET terbayar = terbayar + v_alokasi_deposit, status_tagihan = CASE WHEN (terbayar + v_alokasi_deposit) >= total_tagihan THEN 'Lunas'::status_tagihan_type ELSE 'Sebagian'::status_tagihan_type END WHERE id_tagihan = v_id_tagihan;
            UPDATE penyewa SET saldo_titipan = saldo_titipan - v_alokasi_deposit WHERE id_penyewa = v_kontrak.id_penyewa;
        END IF;
    END LOOP;

    INSERT INTO riwayat_generate_tagihan (periode, id_user, jumlah_tagihan, total_nominal) VALUES (p_periode, p_user_id, v_count, v_total);
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION proses_pembayaran_fifo(p_id_penyewa UUID, p_id_kontrak UUID, p_periode TEXT, p_tanggal_bayar DATE, p_nominal NUMERIC, p_metode_pembayaran TEXT, p_id_user UUID, p_catatan TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_pool NUMERIC := p_nominal;
    v_alokasi NUMERIC;
    v_tagihan RECORD;
    v_id_pembayaran UUID;
BEGIN
    INSERT INTO pembayaran (id_kontrak, id_penyewa, periode, tanggal_bayar, nominal, metode_pembayaran, catatan)
    VALUES (p_id_kontrak, p_id_penyewa, p_periode, p_tanggal_bayar, p_nominal, p_metode_pembayaran, p_catatan) RETURNING id_pembayaran INTO v_id_pembayaran;

    FOR v_tagihan IN SELECT * FROM tagihan WHERE id_kontrak = p_id_kontrak AND status_tagihan NOT IN ('Lunas', 'Dibatalkan', 'Write Off') ORDER BY jatuh_tempo ASC FOR UPDATE LOOP
        EXIT WHEN v_pool <= 0;
        v_alokasi := LEAST(v_pool, v_tagihan.total_tagihan - v_tagihan.terbayar);
        IF v_alokasi > 0 THEN
            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi) VALUES (v_id_pembayaran, v_tagihan.id_tagihan, v_alokasi);
            UPDATE tagihan SET terbayar = terbayar + v_alokasi, status_tagihan = CASE WHEN (terbayar + v_alokasi) >= total_tagihan THEN 'Lunas'::status_tagihan_type ELSE 'Sebagian'::status_tagihan_type END WHERE id_tagihan = v_tagihan.id_tagihan;
            v_pool := v_pool - v_alokasi;
        END IF;
    END LOOP;

    IF v_pool > 0 THEN UPDATE penyewa SET saldo_titipan = saldo_titipan + v_pool WHERE id_penyewa = p_id_penyewa; END IF;
    RETURN jsonb_build_object('success', true);
END;
$$;

COMMIT;
