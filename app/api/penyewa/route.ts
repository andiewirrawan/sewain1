import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const { from, to } = getPagination(page, limit);

    let query = supabase
      .from('penyewa')
      .select(`
        *,
        kontrak_sewa (
          status_kontrak,
          unit (
            kode_unit
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`nama.ilike.%${search}%,whatsapp.ilike.%${search}%,nik.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('nama', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Supabase GET error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const mappedData = data.map((penyewa: any) => {
      const activeContracts = penyewa.kontrak_sewa?.filter((k: any) => k.status_kontrak === 'Aktif') || [];
      const unitList = activeContracts.map((k: any) => k.unit?.kode_unit || '-').join(', ');
      
      return {
        ...penyewa,
        unit_saat_ini: unitList || '-',
        status: activeContracts.length > 0 ? 'Aktif' : 'Non-aktif'
      };
    });

    return NextResponse.json(formatPaginatedResponse(mappedData, count, page, limit));
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
    const { nama, nik, alamat, whatsapp, kontak_darurat, jenis_usaha } = body;

    // Required fields based on UI form
    if (!nama || !nik || !alamat || !whatsapp || !kontak_darurat) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 });
    }

    // Check duplicate NIK
    const { data: existingNik } = await supabase
      .from('penyewa')
      .select('id_penyewa')
      .eq('nik', nik)
      .maybeSingle();
    
    if (existingNik) {
      return NextResponse.json({ message: `Penyewa dengan NIK ${nik} sudah terdaftar.` }, { status: 409 });
    }

    // Check duplicate WhatsApp
    const { data: existingWa } = await supabase
      .from('penyewa')
      .select('id_penyewa')
      .eq('whatsapp', whatsapp)
      .maybeSingle();

    if (existingWa) {
      return NextResponse.json({ message: `Penyewa dengan nomor WhatsApp ${whatsapp} sudah terdaftar.` }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('penyewa')
      .insert([
        {
          nama,
          nik,
          alamat,
          whatsapp,
          kontak_darurat,
          jenis_usaha
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase INSERT error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'CREATE', 'penyewa', data.id_penyewa, null, data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
