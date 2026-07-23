import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jenis_unit = searchParams.get('jenis_unit');
    const status_unit = searchParams.get('status_unit');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabase
      .from('unit')
      .select(`
        *,
        kontrak_sewa (
          id_kontrak,
          status_kontrak,
          tanggal_jatuh_tempo,
          penyewa (nama)
        )
      `, { count: 'exact' });

    if (jenis_unit && jenis_unit !== 'Semua') {
      query = query.eq('jenis_unit', jenis_unit);
    }
    if (status_unit && status_unit !== 'Semua') {
      query = query.eq('status_unit', status_unit);
    }
    if (search) {
      query = query.ilike('kode_unit', `%${search}%`);
    }

    const { data, count, error } = await query
      .order('kode_unit', { ascending: true })
      .range(from, to);

    if (error) throw error;

    const units = data.map((unit: any) => {
      // Find active contract
      const activeContract = unit.kontrak_sewa?.find((k: any) => k.status_kontrak === 'Aktif');
      
      let penyewaNama = null;
      if (activeContract?.penyewa) {
         if (Array.isArray(activeContract.penyewa)) {
             penyewaNama = activeContract.penyewa[0]?.nama;
         } else {
             penyewaNama = activeContract.penyewa.nama;
         }
      }

      return {
        ...unit,
        status_unit: activeContract ? 'Terisi' : 'Kosong',
        penyewa_aktif: penyewaNama,
        jatuh_tempo: activeContract?.tanggal_jatuh_tempo || null,
      };
    });

    return NextResponse.json(formatPaginatedResponse(units, count, page, limit));
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { kode_unit } = body;

    if (!kode_unit) {
      return NextResponse.json({ message: 'Kode unit wajib diisi' }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('unit')
      .select('id_unit')
      .eq('kode_unit', kode_unit)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: `Unit dengan kode ${kode_unit} sudah ada.` }, { status: 409 });
    }

    const { data, error } = await supabase.from('unit').insert(body).select().single();

    if (error) throw error;

    await catatAuditLog(user, 'CREATE', 'unit', data.id_unit, null, data);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
