import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 1. Ambil Riwayat Kontrak & Penyewa
    const { data: kontrakData, error: kontrakError } = await supabase
      .from('kontrak_sewa')
      .select(`
        *,
        penyewa (*)
      `)
      .eq('id_unit', id)
      .order('tanggal_masuk', { ascending: false });

    if (kontrakError) throw kontrakError;

    // 2. Ambil Riwayat Pembayaran Unit
    const kontrakIds = kontrakData?.map(k => k.id_kontrak) || [];
    
    let pembayaranData: any[] = [];
    if (kontrakIds.length > 0) {
      const { data: payData, error: payError } = await supabase
        .from('pembayaran')
        .select(`
          *,
          kontrak_sewa (
            nomor_kontrak,
            penyewa (nama)
          )
        `)
        .in('id_kontrak', kontrakIds)
        .order('tanggal_bayar', { ascending: false });
      
      if (payError) throw payError;
      pembayaranData = payData || [];
    }

    // 3. Hitung Ringkasan
    const summary = {
      total_pembayaran_lunas: pembayaranData
        .filter(p => p.status_pembayaran === 'Lunas')
        .reduce((sum, p) => sum + (p.nominal || 0), 0),
      jumlah_tunggakan: pembayaranData
        .filter(p => p.status_pembayaran === 'Belum Bayar' || p.status_pembayaran === 'Terlambat')
        .length,
      total_lama_terisi_hari: kontrakData.reduce((total, k) => {
        const masuk = new Date(k.tanggal_masuk);
        const keluar = k.tanggal_keluar ? new Date(k.tanggal_keluar) : new Date();
        const diffTime = Math.abs(keluar.getTime() - masuk.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return total + diffDays;
      }, 0)
    };

    return NextResponse.json({
      riwayat_kontrak: kontrakData,
      riwayat_pembayaran: pembayaranData,
      summary
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
