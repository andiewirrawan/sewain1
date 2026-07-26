import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id_penyewa = searchParams.get('id_penyewa');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabaseAdmin
      .from('pembayaran')
      .select(`
        *,
        penyewa (nama),
        alokasi_pembayaran (
          id_alokasi,
          nominal_alokasi,
          tagihan (
            periode,
            kontrak_sewa (
              unit (kode_unit)
            )
          )
        )
      `, { count: 'exact' });

    if (id_penyewa) {
      query = query.eq('id_penyewa', id_penyewa);
    }

    if (search) {
      query = query.or(`penyewa(nama).ilike.%${search}%,metode_pembayaran.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('tanggal_bayar', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPaginatedResponse(data, count, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id_penyewa, 
      id_kontrak,
      tanggal_bayar, 
      nominal, 
      metode_pembayaran, 
      catatan,
      periode 
    } = body;

    if (!id_penyewa || !tanggal_bayar || nominal === undefined || !metode_pembayaran || !periode) {
      return NextResponse.json({ message: 'Field wajib diisi: Penyewa, Tanggal Bayar, Nominal, Metode, Periode' }, { status: 400 });
    }

    // Call PostgreSQL Function (RPC) for safe, transactional FIFO payment
    const { data, error } = await supabaseAdmin.rpc('proses_pembayaran_fifo', {
      p_id_penyewa: id_penyewa,
      p_id_kontrak: id_kontrak || null,
      p_periode: periode,
      p_tanggal_bayar: tanggal_bayar,
      p_nominal: parseFloat(nominal),
      p_metode_pembayaran: metode_pembayaran,
      p_id_user: user.id,
      p_catatan: catatan || ''
    });

    if (error) throw error;
    
    const result = data as any;
    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    await catatAuditLog(user, 'PAYMENT_FIFO_RPC', 'pembayaran', result.id_pembayaran, null, result);

    return NextResponse.json({ 
      success: true, 
      message: 'Pembayaran berhasil diproses', 
      id_pembayaran: result.id_pembayaran,
      sisa_saldo_titipan: result.sisa_saldo_titipan
    }, { status: 201 });

  } catch (error: any) {
    console.error('Payment FIFO error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
