import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_penyewa = searchParams.get('id_penyewa');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('tagihan')
      .select(`
        *,
        kontrak_sewa (
          nomor_kontrak,
          penyewa (nama),
          unit (kode_unit)
        )
      `)
      .order('periode', { ascending: false });

    if (id_penyewa) {
      query = query.eq('kontrak_sewa.id_penyewa', id_penyewa);
    }

    if (status) {
      query = query.eq('status_tagihan', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
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
    const { id_kontrak, periode, jatuh_tempo, nominal_tagihan, id_promo, nominal_diskon, total_tagihan,
           catatan } = body;

    const { data, error } = await supabaseAdmin
      .from('tagihan')
      .insert([
        { 
          id_kontrak, 
          periode, 
          jatuh_tempo, 
          nominal_tagihan, 
          id_promo, 
          nominal_diskon, 
          total_tagihan,
           
          catatan,
          status_tagihan: 'Belum Bayar',
          terbayar: 0
        }
      ])
      .select()
      .single();

    if (error) throw error;

    await catatAuditLog(user, 'CREATE_TAGIHAN_MANUAL', 'tagihan', data.id_tagihan, null, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
