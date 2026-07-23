import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabase
      .from('pembayaran')
      .select(`
        *,
        kontrak_sewa (
          *,
          unit (*),
          penyewa (*)
        )
      `, { count: 'exact' });

    if (bulan && tahun) {
      const periode = `${bulan}-${tahun}`;
      query = query.eq('periode', periode);
    } else if (tahun) {
      query = query.like('periode', `%-${tahun}`);
    }

    if (status && status !== 'Semua') {
      query = query.eq('status_pembayaran', status);
    }

    if (search) {
      query = query.or(`periode.ilike.%${search}%,kontrak_sewa(nomor_kontrak).ilike.%${search}%,kontrak_sewa(penyewa(nama)).ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('periode', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPaginatedResponse(data, count, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id_kontrak, periode, tanggal_bayar, nominal, status_pembayaran, metode_pembayaran, catatan } = body;

    if (!id_kontrak || !periode || !tanggal_bayar || !nominal || !status_pembayaran || !metode_pembayaran) {
      return NextResponse.json({ message: 'Field wajib diisi: Kontrak, Periode, Tanggal Bayar, Nominal, Status, Metode' }, { status: 400 });
    }

    // Explicit duplicate check as requested
    const { data: existingPayment } = await supabase
      .from('pembayaran')
      .select('id_pembayaran')
      .eq('id_kontrak', id_kontrak)
      .eq('periode', periode)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ message: 'Pembayaran untuk periode ini sudah ada.' }, { status: 409 });
    }

    const { data: pembayaranData, error } = await supabase
      .from('pembayaran')
      .insert([
        {
          id_kontrak,
          periode,
          tanggal_bayar,
          nominal,
          status_pembayaran,
          metode_pembayaran,
          catatan
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Pembayaran untuk periode ini sudah ada.' }, { status: 409 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'CREATE', 'pembayaran', pembayaranData.id_pembayaran, null, pembayaranData);

    return NextResponse.json(pembayaranData, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
