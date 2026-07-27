-- Migration: Add priority to promo table and update generation function
-- Created at: 2026-07-27

-- 1. Add prioritas column
ALTER TABLE promo ADD COLUMN IF NOT EXISTS prioritas INTEGER DEFAULT 0;

-- 2. Update generate_tagihan_periode function to use priority
CREATE OR REPLACE FUNCTION generate_tagihan_periode(p_periode TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
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
    IF p_periode !~ '^[0-9]{2}-[0-9]{4}$' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Format periode harus MM-YYYY');
    END IF;

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
        
        BEGIN
            v_jatuh_tempo := make_date(v_tahun, v_bulan, LEAST(v_kontrak.tanggal_jatuh_tempo, 28));
        EXCEPTION WHEN OTHERS THEN
            v_jatuh_tempo := (date_trunc('month', make_date(v_tahun, v_bulan, 1)) + interval '1 month' - interval '1 day')::DATE;
        END;

        -- Updated SELECT to include ORDER BY priority
        SELECT pr.id_promo, pr.nilai_diskon, pr.jenis_diskon 
        INTO v_id_promo, v_nilai_diskon, v_jenis_diskon
        FROM promo pr
        JOIN promo_penyewa pp ON pr.id_promo = pp.id_promo
        WHERE pp.id_penyewa = v_kontrak.id_penyewa
        AND pr.status = 'Aktif'
        AND v_jatuh_tempo BETWEEN pr.tanggal_mulai AND pr.tanggal_selesai
        ORDER BY pr.prioritas DESC
        LIMIT 1;

        IF v_id_promo IS NOT NULL THEN
            IF v_jenis_diskon = 'Persen' THEN
                v_nominal_diskon := v_nominal_tagihan * (v_nilai_diskon / 100);
            ELSE
                v_nominal_diskon := v_nilai_diskon;
            END IF;
        ELSE
            v_nominal_diskon := 0;
        END IF;

        v_total_tagihan := GREATEST(v_nominal_tagihan - v_nominal_diskon, 0);

        INSERT INTO tagihan (
            id_kontrak, periode, jatuh_tempo, nominal_tagihan, 
            id_promo, nominal_diskon, total_tagihan, status_tagihan
        ) VALUES (
            v_kontrak.id_kontrak, p_periode, v_jatuh_tempo, v_nominal_tagihan,
            v_id_promo, v_nominal_diskon, v_total_tagihan, 'Belum Bayar'
        ) RETURNING id_tagihan INTO v_id_tagihan;

        v_count := v_count + 1;
        v_total := v_total + v_total_tagihan;

        SELECT saldo_titipan INTO v_saldo_penyewa 
        FROM penyewa p
        WHERE p.id_penyewa = v_kontrak.id_penyewa 
        FOR UPDATE;
                
        IF v_saldo_penyewa > 0 AND v_total_tagihan > 0 THEN
            v_alokasi_deposit := LEAST(v_saldo_penyewa, v_total_tagihan);
            
            INSERT INTO pembayaran (
                id_kontrak, id_penyewa, periode, tanggal_bayar, 
                nominal, status_pembayaran, metode_pembayaran, catatan
            ) VALUES (
                v_kontrak.id_kontrak, v_kontrak.id_penyewa, p_periode, CURRENT_DATE,
                v_alokasi_deposit, 'Lunas', 'Saldo Titipan', 'Alokasi otomatis dari deposit saat generate tagihan'
            ) RETURNING id_pembayaran INTO v_id_pembayaran;

            INSERT INTO alokasi_pembayaran (id_pembayaran, id_tagihan, nominal_alokasi)
            VALUES (v_id_pembayaran, v_id_tagihan, v_alokasi_deposit);

            UPDATE tagihan SET 
                terbayar = v_alokasi_deposit,
                status_tagihan = CASE WHEN v_alokasi_deposit >= v_total_tagihan THEN 'Lunas' ELSE 'Sebagian' END
            WHERE id_tagihan = v_id_tagihan;

            UPDATE penyewa p SET saldo_titipan = p.saldo_titipan - v_alokasi_deposit WHERE p.id_penyewa = v_kontrak.id_penyewa;
        END IF;
    END LOOP;

    INSERT INTO riwayat_generate_tagihan (periode, id_user, jumlah_tagihan, total_nominal, status)
    VALUES (p_periode, p_user_id, v_count, v_total, 'Selesai');

    RETURN jsonb_build_object('success', true, 'count', v_count, 'total', v_total);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
