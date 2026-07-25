import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id_penyewa, jumlah_tagihan, total_piutang, status, error_msg } = body;

    const { data, error } = await supabaseAdmin
      .from('log_wa_tagihan')
      .insert([{
        id_penyewa,
        id_user: user.id,
        jumlah_tagihan_dilampirkan: jumlah_tagihan,
        total_piutang_wa: total_piutang,
        status_kirim: status || 'Berhasil',
        pesan_error: error_msg
      }])
      .select()
      .single();

    if (error) throw error;

    await catatAuditLog(user, 'SEND_WA_REMINDER', 'log_wa_tagihan', data.id_log, null, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_penyewa = searchParams.get('id_penyewa');

    let query = supabaseAdmin
      .from('log_wa_tagihan')
      .select(`
        *,
        penyewa (nama),
        users (nama)
      `)
      .order('tanggal_kirim', { ascending: false });

    if (id_penyewa) {
      query = query.eq('id_penyewa', id_penyewa);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
