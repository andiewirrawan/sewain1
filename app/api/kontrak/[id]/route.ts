import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;

    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('kontrak_sewa')
      .select(`
        *,
        unit (*),
        penyewa (*)
      `)
      .eq('id_kontrak', id)
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = await getUserFromRequest(request as any);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: oldData, error: fetchError } = await supabase
      .from('kontrak_sewa')
      .select('*')
      .eq('id_kontrak', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Kontrak tidak ditemukan' }, { status: 404 });
    }

    const updatePayload: any = {};
    if (body.status_kontrak) updatePayload.status_kontrak = body.status_kontrak;
    if (body.tanggal_keluar) updatePayload.tanggal_keluar = body.tanggal_keluar;
    if (body.tanggal_jatuh_tempo) updatePayload.tanggal_jatuh_tempo = Number(body.tanggal_jatuh_tempo);

    const { data, error } = await supabase
      .from('kontrak_sewa')
      .update(updatePayload)
      .eq('id_kontrak', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (body.status_kontrak === 'Selesai' || body.status_kontrak === 'Diputus') {
      await supabase.from('unit').update({ status_unit: 'Kosong' }).eq('id_unit', data.id_unit);
    }

    await catatAuditLog(user, 'UPDATE', 'kontrak_sewa', id, oldData, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = await getUserFromRequest(request as any);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Forbidden: Owner only' }, { status: 403 });
    }

    const { data: oldData, error: fetchError } = await supabase
      .from('kontrak_sewa')
      .select('*')
      .eq('id_kontrak', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Kontrak tidak ditemukan' }, { status: 404 });
    }
    
    const { data: payments } = await supabase.from('pembayaran').select('id_pembayaran').eq('id_kontrak', id);
    if (payments && payments.length > 0) {
       return NextResponse.json({ message: 'Tidak dapat menghapus kontrak karena sudah memiliki riwayat pembayaran' }, { status: 400 });
    }

    const { error } = await supabase
      .from('kontrak_sewa')
      .delete()
      .eq('id_kontrak', id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (oldData.status_kontrak === 'Aktif') {
      await supabase.from('unit').update({ status_unit: 'Kosong' }).eq('id_unit', oldData.id_unit);
    }

    await catatAuditLog(user, 'DELETE', 'kontrak_sewa', id, oldData, null);

    return NextResponse.json({ message: 'Kontrak berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
