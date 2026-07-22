import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

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
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    
    console.log("Authorization Header:", request.headers.get("authorization"));
    const user = await getUserFromRequest(request as any);
    console.log("Decoded User:", user);

    if (!user) {
      console.log("User is null. Reason: Token missing or invalid.");
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('pembayaran'); // base query placeholder
    let data = null;
    let error = null;

    if (jenis === 'occupancy') {
      const { data: units, error: e } = await supabase.from('unit').select('status_unit, jenis_unit');
      error = e;
      const occupancyObj = units?.reduce((acc, u) => {
        if (!acc[u.jenis_unit]) acc[u.jenis_unit] = { jenis_unit: u.jenis_unit, total: 0, terisi: 0, kosong: 0 };
        acc[u.jenis_unit].total++;
        if (u.status_unit === 'Terisi') acc[u.jenis_unit].terisi++;
        else acc[u.jenis_unit].kosong++;
        return acc;
      }, {} as any);
      data = Object.values(occupancyObj || {});
    } else if (jenis === 'pendapatan') {
      let q = supabase.from('pembayaran').select('tanggal_bayar, periode, kontrak_sewa(penyewa(nama), unit(kode_unit)), nominal, metode_pembayaran').eq('status_pembayaran', 'Lunas');
      if (bulan) q = q.eq('periode', `${bulan}-${tahun || new Date().getFullYear()}`);
      else if (tahun) q = q.ilike('periode', `%-${tahun}`);
      const { data: p, error: e } = await q;
      error = e;
      data = p;
    } else if (jenis === 'tunggakan') {
      const { data: t, error: e } = await supabase.from('pembayaran').select('kontrak_sewa(id_kontrak, penyewa(nama), unit(kode_unit), tanggal_jatuh_tempo), periode, nominal, status_pembayaran').in('status_pembayaran', ['Belum Bayar', 'Terlambat']);
      error = e;
      data = t;
    } else if (jenis === 'pembayaran') {
      const { data: p, error: e } = await supabase.from('pembayaran').select('periode, kontrak_sewa(penyewa(nama), unit(kode_unit)), tanggal_bayar, nominal, status_pembayaran, metode_pembayaran');
      error = e;
      data = p;
    } else if (jenis === 'penyewa-aktif') {
      const { data: p, error: e } = await supabase.from('kontrak_sewa').select('penyewa(nama, whatsapp), unit(kode_unit), tanggal_masuk, status_kontrak').eq('status_kontrak', 'Aktif');
      error = e;
      data = p;
    } else if (jenis === 'riwayat-penyewa') {
      const { data: r, error: e } = await supabase.from('kontrak_sewa').select('penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak');
      error = e;
      data = r;
    } else if (jenis === 'kontrak') {
      const { data: k, error: e } = await supabase.from('kontrak_sewa').select('nomor_kontrak, penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak');
      error = e;
      data = k;
    } else if (jenis === 'unit') {
      const { data: u, error: e } = await supabase.from('unit').select('kode_unit, jenis_unit, harga_sewa, status_unit, kontrak_sewa(penyewa(nama))').eq('kontrak_sewa.status_kontrak', 'Aktif');
      error = e;
      data = u;
    } else {
      return NextResponse.json({ message: 'Jenis laporan tidak ditemukan' }, { status: 404 });
    }

    if (error) throw error;
    return NextResponse.json(sanitize(data));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
