import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jenis: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { jenis } = await params;

    if (jenis === 'occupancy') {
      const { data: units } = await supabase.from('unit').select('status_unit, jenis_unit');
      const occupancy = units?.reduce((acc, u) => {
        if (!acc[u.jenis_unit]) acc[u.jenis_unit] = { total: 0, terisi: 0, kosong: 0 };
        acc[u.jenis_unit].total++;
        if (u.status_unit === 'Terisi') acc[u.jenis_unit].terisi++;
        else acc[u.jenis_unit].kosong++;
        return acc;
      }, {} as any);
      return NextResponse.json(occupancy);
    } else if (jenis === 'pendapatan') {
      const { data: pembayaran } = await supabase.from('pembayaran').select('nominal, periode').eq('status_pembayaran', 'Lunas');
      return NextResponse.json(pembayaran);
    } else if (jenis === 'tunggakan') {
      const { data: tunggakan } = await supabase.from('pembayaran').select('kontrak_sewa(id_kontrak, penyewa(nama), unit(kode_unit)), periode, nominal').in('status_pembayaran', ['Belum Bayar', 'Terlambat']);
      return NextResponse.json(tunggakan);
    } else if (jenis === 'pembayaran') {
      const { data: pembayaran } = await supabase.from('pembayaran').select('*, kontrak_sewa(penyewa(nama), unit(kode_unit))');
      return NextResponse.json(pembayaran);
    } else if (jenis === 'penyewa-aktif') {
      const { data: penyewa } = await supabase.from('kontrak_sewa').select('penyewa(nama, whatsapp, email), unit(kode_unit)').eq('status_kontrak', 'Aktif');
      return NextResponse.json(penyewa);
    } else if (jenis === 'riwayat-penyewa') {
      const { data: riwayat } = await supabase.from('kontrak_sewa').select('penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak');
      return NextResponse.json(riwayat);
    }

    return NextResponse.json({ message: 'Jenis laporan tidak ditemukan' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
