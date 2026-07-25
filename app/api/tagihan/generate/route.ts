import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { periode, jatuh_tempo } = body;

    if (!periode || !jatuh_tempo) {
      return NextResponse.json({ message: 'Periode dan Tanggal Jatuh Tempo wajib diisi' }, { status: 400 });
    }

    // 1. Ambil semua kontrak aktif
    const { data: kontrakAktif, error: errKontrak } = await supabaseAdmin
      .from('kontrak_sewa')
      .select(`
        id_kontrak,
        id_unit,
        id_penyewa,
        unit (harga_sewa),
        penyewa (
          id_penyewa,
          promo_penyewa (
            promo (*)
          )
        )
      `)
      .eq('status_kontrak', 'Aktif');

    if (errKontrak) throw errKontrak;

    // 2. Filter kontrak yang sudah punya tagihan di periode ini
    const { data: tagihanEksis, error: errEksis } = await supabaseAdmin
      .from('tagihan')
      .select('id_kontrak')
      .eq('periode', periode);

    if (errEksis) throw errEksis;
    const eksisIds = new Set(tagihanEksis?.map(t => t.id_kontrak));

    const kontrakToGenerate = kontrakAktif.filter(k => !eksisIds.has(k.id_kontrak));

    if (kontrakToGenerate.length === 0) {
      return NextResponse.json({ message: 'Seluruh kontrak sudah memiliki tagihan untuk periode ini' }, { status: 400 });
    }

    let totalNominal = 0;
    const now = new Date();

    const tagihanInserts = kontrakToGenerate.map(k => {
      const hargaNormal = k.unit?.harga_sewa || 0;
      
      // Cari promo aktif
      const activePromos = k.penyewa?.promo_penyewa
        ?.map((item: any) => item.promo)
        ?.filter((p: any) => {
          if (!p || p.status !== 'Aktif') return false;
          const startDate = new Date(p.tanggal_mulai);
          const endDate = new Date(p.tanggal_selesai);
          endDate.setHours(23, 59, 59, 999);
          return startDate <= now && endDate >= now;
        }) || [];
      
      const active = activePromos.sort((a: any, b: any) => {
        if ((b.prioritas || 0) !== (a.prioritas || 0)) {
          return (b.prioritas || 0) - (a.prioritas || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0] || null;

      let nominalDiskon = 0;
      if (active) {
        if (active.jenis_diskon === 'Persen') {
          nominalDiskon = (hargaNormal * active.nilai_diskon) / 100;
        } else {
          nominalDiskon = Math.min(active.nilai_diskon, hargaNormal);
        }
      }

      const totalTagihan = hargaNormal - nominalDiskon;
      totalNominal += totalTagihan;

      return {
        id_kontrak: k.id_kontrak,
        periode,
        jatuh_tempo,
        nominal_tagihan: hargaNormal,
        id_promo: active?.id_promo || null,
        nominal_diskon,
        total_tagihan: totalTagihan,
        status_tagihan: 'Belum Bayar',
        terbayar: 0
      };
    });

    // 3. Simpan tagihan
    const { error: errInsert } = await supabaseAdmin
      .from('tagihan')
      .insert(tagihanInserts);

    if (errInsert) throw errInsert;

    // 4. Catat riwayat generate
    const { data: riwayat, error: errRiwayat } = await supabaseAdmin
      .from('riwayat_generate_tagihan')
      .insert([
        {
          periode,
          id_user: user.id,
          jumlah_tagihan: tagihanInserts.length,
          total_nominal: totalNominal,
          status: 'Selesai'
        }
      ])
      .select()
      .single();

    if (errRiwayat) throw errRiwayat;

    await catatAuditLog(user, 'GENERATE_TAGIHAN', 'tagihan', riwayat.id_generate, null, riwayat);

    return NextResponse.json({ 
      message: `Berhasil membuat ${tagihanInserts.length} tagihan`,
      count: tagihanInserts.length
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
