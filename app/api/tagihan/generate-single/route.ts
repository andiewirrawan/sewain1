import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan } = body;

    if (!id_kontrak || !periode || !jatuh_tempo || nominal_tagihan === undefined) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Cek apakah kontrak aktif
    const { data: kontrak, error: kontrakError } = await supabaseAdmin
      .from('kontrak_sewa')
      .select('*, unit(*), penyewa(*)')
      .eq('id_kontrak', id_kontrak)
      .single();

    if (kontrakError || !kontrak) {
      return NextResponse.json({ message: 'Kontrak tidak ditemukan' }, { status: 404 });
    }

    if (kontrak.status_kontrak !== 'Aktif') {
      return NextResponse.json({ message: 'Kontrak sudah tidak aktif' }, { status: 400 });
    }

    // 2. Cek apakah tagihan sudah ada
    const { data: existing } = await supabaseAdmin
      .from('tagihan')
      .select('id_tagihan')
      .eq('id_kontrak', id_kontrak)
      .eq('periode', periode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: 'Tagihan periode ini sudah dibuat.' }, { status: 400 });
    }

    // 3. Insert Tagihan
    const { data: tagihan, error: tagihanError } = await supabaseAdmin
      .from('tagihan')
      .insert({
        id_kontrak,
        periode,
        jatuh_tempo,
        nominal_tagihan,
        id_promo: id_promo || null,
        nominal_diskon: nominal_diskon || 0,
        total_tagihan,
        status_tagihan: 'Belum Bayar'
      })
      .select()
      .single();

    if (tagihanError) throw tagihanError;

    // 4. Insert Riwayat Generate (untuk audit & log)
    await supabaseAdmin
      .from('riwayat_generate_tagihan')
      .insert({
        periode,
        id_user: user.id,
        jumlah_tagihan: 1,
        jumlah_skip: 0,
        total_nominal: total_tagihan,
        status: 'Selesai'
      });

    // 5. Cek Saldo Titipan (Otomatis alokasi jika ada saldo)
    const saldoTitipan = parseFloat(kontrak.penyewa?.saldo_titipan || 0);
    if (saldoTitipan > 0) {
      const alokasi = Math.min(saldoTitipan, total_tagihan);
      
      // Create payment
      const { data: pembayaran, error: payError } = await supabaseAdmin
        .from('pembayaran')
        .insert({
          id_kontrak,
          id_penyewa: kontrak.id_penyewa,
          periode,
          tanggal_bayar: new Date().toISOString().split('T')[0],
          nominal: alokasi,
          status_pembayaran: 'Lunas',
          metode_pembayaran: 'Saldo Titipan',
          catatan: 'Alokasi otomatis dari deposit saat generate tagihan manual'
        })
        .select()
        .single();

      if (!payError && pembayaran) {
        // Create allocation
        await supabaseAdmin
          .from('alokasi_pembayaran')
          .insert({
            id_pembayaran: pembayaran.id_pembayaran,
            id_tagihan: tagihan.id_tagihan,
            nominal_alokasi: alokasi
          });

        // Update tagihan
        const newStatus = alokasi >= total_tagihan ? 'Lunas' : 'Sebagian';
        await supabaseAdmin
          .from('tagihan')
          .update({
            terbayar: alokasi,
            status_tagihan: newStatus
          })
          .eq('id_tagihan', tagihan.id_tagihan);

        // Update saldo penyewa
        await supabaseAdmin
          .from('penyewa')
          .update({
            saldo_titipan: saldoTitipan - alokasi
          })
          .eq('id_penyewa', kontrak.id_penyewa);
      }
    }

    await catatAuditLog(user, 'GENERATE_SINGLE', 'tagihan', tagihan.id_tagihan, null, tagihan);

    return NextResponse.json({ 
      message: 'Berhasil membuat tagihan',
      data: tagihan
    });

  } catch (error: any) {
    console.error('Generate single error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
