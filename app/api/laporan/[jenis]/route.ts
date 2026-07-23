import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const noPagination = searchParams.get('no_pagination') === 'true';
    
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { from, to } = getPagination(page, limit);

    let data = null;
    let error = null;
    let totalCount = 0;

    if (jenis === 'occupancy') {
      const { data: units, error: e } = await supabase.from('unit').select('jenis_unit, kontrak_sewa(status_kontrak)');
      error = e;
      const occupancyObj = units?.reduce((acc, u) => {
        if (!acc[u.jenis_unit]) acc[u.jenis_unit] = { jenis_unit: u.jenis_unit, total: 0, terisi: 0, kosong: 0 };
        acc[u.jenis_unit].total++;
        
        const hasActiveContract = Array.isArray(u.kontrak_sewa) 
          ? u.kontrak_sewa.some((k: any) => k.status_kontrak === 'Aktif')
          : (u.kontrak_sewa?.status_kontrak === 'Aktif');

        if (hasActiveContract) acc[u.jenis_unit].terisi++;
        else acc[u.jenis_unit].kosong++;
        return acc;
      }, {} as any);
      data = Object.values(occupancyObj || {});
      totalCount = data.length;
    } else if (jenis === 'pendapatan') {
      let q = supabase.from('pembayaran').select('tanggal_bayar, periode, kontrak_sewa(penyewa(nama), unit(kode_unit)), nominal, metode_pembayaran', { count: 'exact' }).eq('status_pembayaran', 'Lunas');
      if (bulan) q = q.eq('periode', `${bulan}-${tahun || new Date().getFullYear()}`);
      else if (tahun) q = q.ilike('periode', `%-${tahun}`);
      
      if (!noPagination) q = q.range(from, to);
      const { data: p, error: e, count } = await q.order('tanggal_bayar', { ascending: false });
      error = e;
      data = p;
      totalCount = count || 0;
    } else if (jenis === 'tunggakan') {
      let q = supabase.from('pembayaran').select('kontrak_sewa(id_kontrak, penyewa(nama), unit(kode_unit), tanggal_jatuh_tempo), periode, nominal, status_pembayaran', { count: 'exact' }).in('status_pembayaran', ['Belum Bayar', 'Terlambat']);
      if (!noPagination) q = q.range(from, to);
      const { data: t, error: e, count } = await q.order('periode', { ascending: false });
      error = e;
      data = t;
      totalCount = count || 0;
    } else if (jenis === 'pembayaran') {
      let q = supabase.from('pembayaran').select('periode, kontrak_sewa(penyewa(nama), unit(kode_unit)), tanggal_bayar, nominal, status_pembayaran, metode_pembayaran', { count: 'exact' });
      if (bulan) q = q.eq('periode', `${bulan}-${tahun || new Date().getFullYear()}`);
      else if (tahun) q = q.ilike('periode', `%-${tahun}`);
      if (!noPagination) q = q.range(from, to);
      const { data: p, error: e, count } = await q.order('tanggal_bayar', { ascending: false });
      error = e;
      data = p;
      totalCount = count || 0;
    } else if (jenis === 'penyewa-aktif') {
      let q = supabase.from('kontrak_sewa').select('penyewa(nama, whatsapp), unit(kode_unit), tanggal_masuk, status_kontrak', { count: 'exact' }).eq('status_kontrak', 'Aktif');
      if (!noPagination) q = q.range(from, to);
      const { data: p, error: e, count } = await q.order('tanggal_masuk', { ascending: false });
      error = e;
      data = p;
      totalCount = count || 0;
    } else if (jenis === 'riwayat-penyewa') {
      let q = supabase.from('kontrak_sewa').select('penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak', { count: 'exact' });
      if (!noPagination) q = q.range(from, to);
      const { data: r, error: e, count } = await q.order('tanggal_masuk', { ascending: false });
      error = e;
      data = r;
      totalCount = count || 0;
    } else if (jenis === 'kontrak') {
      let q = supabase.from('kontrak_sewa').select('nomor_kontrak, penyewa(nama), unit(kode_unit), tanggal_masuk, tanggal_keluar, status_kontrak', { count: 'exact' });
      if (!noPagination) q = q.range(from, to);
      const { data: k, error: e, count } = await q.order('tanggal_masuk', { ascending: false });
      error = e;
      data = k;
      totalCount = count || 0;
    } else if (jenis === 'unit') {
      let q = supabase.from('unit').select(`
          id_unit,
          kode_unit, 
          jenis_unit, 
          harga_sewa, 
          status_unit, 
          kontrak_sewa(
            id_kontrak,
            status_kontrak,
            penyewa(
              id_penyewa,
              nama
            )
          )
        `, { count: 'exact' });
      
      if (!noPagination) q = q.range(from, to);
      const { data: u, error: e, count } = await q.order('kode_unit');
      error = e;
      totalCount = count || 0;
      
      if (u) {
        data = u.map(item => {
          const contracts = Array.isArray(item.kontrak_sewa) ? item.kontrak_sewa : (item.kontrak_sewa ? [item.kontrak_sewa] : []);
          const activeContract = contracts.find((k: any) => k.status_kontrak === 'Aktif');
          
          return {
            id_unit: item.id_unit,
            unit: item.kode_unit,
            jenis_unit: item.jenis_unit,
            harga_sewa: item.harga_sewa,
            status_unit: activeContract ? 'Terisi' : 'Kosong',
            penyewa: activeContract?.penyewa?.nama || null,
            id_kontrak: activeContract?.id_kontrak || null,
            id_penyewa: activeContract?.penyewa?.id_penyewa || null
          };
        });
      }
    } else {
      return NextResponse.json({ message: 'Jenis laporan tidak ditemukan' }, { status: 404 });
    }

    if (error) throw error;

    if (noPagination || jenis === 'occupancy') {
      return NextResponse.json(sanitize(data));
    }

    return NextResponse.json(formatPaginatedResponse(sanitize(data), totalCount, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
