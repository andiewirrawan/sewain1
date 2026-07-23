import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import { generateNomorKontrak } from '@/lib/kontrak';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabase
      .from('kontrak_sewa')
      .select(`
        *,
        unit (*),
        penyewa (*)
      `, { count: 'exact' });

    if (status && status !== 'Semua') {
      query = query.eq('status_kontrak', status);
    }

    if (search) {
      query = query.or(`nomor_kontrak.ilike.%${search}%,penyewa(nama).ilike.%${search}%,unit(kode_unit).ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('tanggal_masuk', { ascending: false })
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
    const { id_unit, id_penyewa, tanggal_masuk, tanggal_jatuh_tempo } = body;

    if (!id_unit || !id_penyewa || !tanggal_masuk || !tanggal_jatuh_tempo) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
    }

    // Check if unit already has an active contract
    const { data: activeContract } = await supabase
      .from('kontrak_sewa')
      .select('id_kontrak')
      .eq('id_unit', id_unit)
      .eq('status_kontrak', 'Aktif')
      .maybeSingle();
    
    if (activeContract) {
      return NextResponse.json({ message: 'Unit ini masih memiliki kontrak aktif. Selesaikan kontrak lama terlebih dahulu.' }, { status: 400 });
    }

    const { data: unitData, error: errUnit } = await supabase.from('unit').select('*').eq('id_unit', id_unit).single();
    if (errUnit || !unitData) return NextResponse.json({ message: 'Unit tidak ditemukan' }, { status: 404 });

    const { data: penyewaData, error: errPenyewa } = await supabase.from('penyewa').select('*').eq('id_penyewa', id_penyewa).single();
    if (errPenyewa || !penyewaData) return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 });

    if (unitData.jenis_unit === 'Pujasera' && !penyewaData.jenis_usaha) {
      return NextResponse.json({ message: 'Untuk unit Pujasera, jenis usaha penyewa tidak boleh kosong' }, { status: 400 });
    }

    const nomor_kontrak = await generateNomorKontrak(tanggal_masuk);

    const payload = {
      nomor_kontrak,
      id_unit,
      id_penyewa,
      tanggal_masuk,
      tanggal_jatuh_tempo: Number(tanggal_jatuh_tempo),
      status_kontrak: 'Aktif'
    };

    const { data: kontrakData, error } = await supabase
      .from('kontrak_sewa')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await supabase.from('unit').update({ status_unit: 'Terisi' }).eq('id_unit', id_unit);

    await catatAuditLog(user, 'CREATE', 'kontrak_sewa', kontrakData.id_kontrak, null, kontrakData);

    return NextResponse.json(kontrakData, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
