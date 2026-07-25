import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'Semua';

    const { from, to } = getPagination(page, limit);

    let query = supabase
      .from('promo')
      .select('*, promo_penyewa(count)', { count: 'exact' });

    if (search) {
      query = query.ilike('nama_promo', `%${search}%`);
    }

    if (status !== 'Semua') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const mappedData = data.map((p: any) => ({
      ...p,
      jumlah_penyewa: p.promo_penyewa?.[0]?.count || 0
    }));

    return NextResponse.json(formatPaginatedResponse(mappedData, count, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Akses ditolak (Hanya Owner)' }, { status: 403 });
    }

    const body = await request.json();
    const { nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, keterangan, id_penyewa_list, prioritas } = body;

    if (!nama_promo || !jenis_diskon || !nilai_diskon || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json({ message: 'Field wajib diisi' }, { status: 400 });
    }

    const { data: promo, error: promoError } = await supabase
      .from('promo')
      .insert([
        { 
          nama_promo, 
          jenis_diskon, 
          nilai_diskon: parseFloat(nilai_diskon), 
          tanggal_mulai, 
          tanggal_selesai, 
          status: status || 'Aktif', 
          keterangan,
          prioritas: prioritas ? parseInt(prioritas) : 0
        }
      ])
      .select()
      .single();

    if (promoError) {
      return NextResponse.json({ message: promoError.message }, { status: 500 });
    }

    // Assign tenants if provided
    if (id_penyewa_list && Array.isArray(id_penyewa_list) && id_penyewa_list.length > 0) {
      const assignments = id_penyewa_list.map((idPenyewa: string) => ({
        id_promo: promo.id_promo,
        id_penyewa: idPenyewa
      }));

      const { error: assignError } = await supabase.from('promo_penyewa').insert(assignments);
      if (assignError) {
        console.error('Error assigning tenants to promo:', assignError);
      }
    }

    await catatAuditLog(user, 'CREATE_PROMO', 'promo', promo.id_promo, null, promo);
    return NextResponse.json(promo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
