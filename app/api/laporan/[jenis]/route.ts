import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// Helper to sanitize BigInt to Number/String if needed (Supabase usually returns numbers, but just in case)
function sanitize(data: any): any {
  if (Array.isArray(data)) return data.map(sanitize);
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : sanitize(v)])
    );
  }
  return data;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jenis: string }> }
) {
  try {
    const { jenis } = await params;
    console.log(`[Laporan API] Request: ${jenis}`);
    
    const user = await getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    let data = null;
    let error = null;

    if (jenis === 'occupancy') {
      const { data: units, error: e } = await supabase.from('unit').select('status_unit, jenis_unit');
      error = e;
      const occupancy = units?.reduce((acc, u) => {
        if (!acc[u.jenis_unit]) acc[u.jenis_unit] = { total: 0, terisi: 0, kosong: 0 };
        acc[u.jenis_unit].total++;
        if (u.status_unit === 'Terisi') acc[u.jenis_unit].terisi++;
        else acc[u.jenis_unit].kosong++;
        return acc;
      }, {} as any);
      data = occupancy;
    } else if (jenis === 'pendapatan') {
      const { data: p, error: e } = await supabase.from('pembayaran').select('nominal, periode').eq('status_pembayaran', 'Lunas');
      error = e;
      data = p;
    } else if (jenis === 'tunggakan') {
      const { data: t, error: e } = await supabase.from('pembayaran').select('kontrak_sewa(id_kontrak, penyewa(nama), unit(kode_unit)), periode, nominal').in('status_pembayaran', ['Belum Bayar', 'Terlambat']);
      error = e;
      data = t;
    } else if (jenis === 'pembayaran') {
      const { data: p, error: e } = await supabase.from('pembayaran').select('*, kontrak_sewa(penyewa(nama), unit(kode_unit))');
      error = e;
      data = p;
    } else if (jenis === 'penyewa-aktif') {
      const { data: p, error: e } = await supabase.from('kontrak_sewa').select('penyewa(nama, whatsapp, email), unit(kode_unit)').eq('status_kontrak', 'Aktif');
      error = e;
      data = p;
    } else if (jenis === 'riwayat-penyewa') {
      const { data: r, error: e } = await supabase.from('kontrak_sewa').select('penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak');
      error = e;
      data = r;
    } else {
      return NextResponse.json({ message: 'Jenis laporan tidak ditemukan' }, { status: 404 });
    }

    if (error) {
      console.error(`[Laporan API] Query error for ${jenis}:`, error);
      throw error;
    }

    const sanitizedData = sanitize(data);
    console.log(`[Laporan API] Successfully fetched ${jenis}. Data count: ${Array.isArray(sanitizedData) ? sanitizedData.length : 'N/A'}`);
    
    return NextResponse.json(sanitizedData);
  } catch (error: any) {
    console.error(`[Laporan API] Error for ${params}:`, error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
