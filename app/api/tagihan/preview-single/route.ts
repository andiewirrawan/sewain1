import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_kontrak = searchParams.get('id_kontrak');
    const periode = searchParams.get('periode');

    if (!id_kontrak || !periode) {
      return NextResponse.json({ message: 'ID Kontrak dan Periode wajib diisi' }, { status: 400 });
    }

    // 1. Ambil data kontrak & unit
    const { data: kontrak, error: kontrakError } = await supabaseAdmin
      .from('kontrak_sewa')
      .select('*, unit(*), penyewa(*)')
      .eq('id_kontrak', id_kontrak)
      .single();

    if (kontrakError || !kontrak) {
      return NextResponse.json({ message: 'Kontrak tidak ditemukan' }, { status: 404 });
    }

    const nominal_tagihan = parseFloat(kontrak.unit.harga_sewa);
    
    // 2. Hitung Jatuh Tempo Estimasi
    const [bulan, tahun] = periode.split('-').map(Number);
    let jatuh_tempo_date;
    try {
      jatuh_tempo_date = new Date(tahun, bulan - 1, Math.min(kontrak.tanggal_jatuh_tempo, 28));
    } catch {
      jatuh_tempo_date = new Date(tahun, bulan, 0); // Last day of month
    }
    const jatuh_tempo = jatuh_tempo_date.toISOString().split('T')[0];

    // 3. Cari Promo Terbaik
    // Logic: Active, within date range, highest priority
    const { data: promos } = await supabaseAdmin
      .from('promo')
      .select('*, promo_penyewa!inner(*)')
      .eq('promo_penyewa.id_penyewa', kontrak.id_penyewa)
      .eq('status', 'Aktif')
      .lte('tanggal_mulai', jatuh_tempo)
      .gte('tanggal_selesai', jatuh_tempo)
      .order('prioritas', { ascending: false });

    const bestPromo = promos && promos.length > 0 ? promos[0] : null;
    
    let nominal_diskon = 0;
    if (bestPromo) {
      if (bestPromo.jenis_diskon === 'Persen') {
        nominal_diskon = nominal_tagihan * (parseFloat(bestPromo.nilai_diskon) / 100);
      } else {
        nominal_diskon = parseFloat(bestPromo.nilai_diskon);
      }
    }

    const total_tagihan = Math.max(nominal_tagihan - nominal_diskon, 0);

    // 4. Cek apakah sudah ada tagihan
    const { data: existing } = await supabaseAdmin
      .from('tagihan')
      .select('id_tagihan')
      .eq('id_kontrak', id_kontrak)
      .eq('periode', periode)
      .maybeSingle();

    return NextResponse.json({
      kontrak,
      periode,
      jatuh_tempo,
      nominal_tagihan,
      promo: bestPromo,
      nominal_diskon,
      total_tagihan,
      is_existing: !!existing
    });

  } catch (error: any) {
    console.error('Preview single error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
