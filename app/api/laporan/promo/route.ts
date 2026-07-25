import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getUserFromRequest } from '@/lib/auth';
import { getPagination } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const noPagination = searchParams.get('no_pagination') === 'true';

    let query = supabase
      .from('promo')
      .select(`
        *,
        pembayaran (
          nominal_diskon
        )
      `, { count: 'exact' });

    if (!noPagination) {
      const { from, to } = getPagination(page, limit);
      query = query.range(from, to);
    }

    const { data, error, count } = await query
      .order('nama_promo', { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const result = data.map((p: any) => ({
      ...p,
      jumlah_digunakan: p.pembayaran?.length || 0,
      total_potongan: p.pembayaran?.reduce((sum: number, pay: any) => sum + (pay.nominal_diskon || 0), 0) || 0
    }));

    if (noPagination) {
      return NextResponse.json(result);
    }

    return NextResponse.json({
      data: result,
      pagination: {
        total: count || result.length,
        page,
        limit,
        total_pages: Math.ceil((count || result.length) / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
