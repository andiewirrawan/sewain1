import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const { data, error } = await supabaseAdmin
      .from('tagihan')
      .select(`
        *,
        kontrak_sewa (
          nomor_kontrak,
          penyewa (*),
          unit (*)
        ),
        alokasi_pembayaran (
          nominal_alokasi,
          created_at,
          pembayaran (*)
        )
      `)
      .eq('id_tagihan', id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status_tagihan, catatan, alasan_perubahan } = body;

    // Handle Write Off specially via RPC
    if (status_tagihan === 'Write Off') {
      if (user.role === 'Admin') return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      const { data, error } = await supabaseAdmin.rpc('write_off_tagihan', {
        p_id_tagihan: id,
        p_id_user: user.id,
        p_catatan: alasan_perubahan || catatan || 'Write off'
      });

      if (error) throw error;
      const result = data as any;
      if (!result.success) return NextResponse.json({ message: result.message }, { status: 400 });

      return NextResponse.json({ message: 'Tagihan berhasil di-write off' });
    }

    const { jatuh_tempo, nominal_tagihan, nominal_diskon, total_tagihan } = body;
    const { data: oldData } = await supabaseAdmin.from('tagihan').select('*').eq('id_tagihan', id).single();

    const { data, error } = await supabaseAdmin
      .from('tagihan')
      .update({
        jatuh_tempo,
        nominal_tagihan,
        nominal_diskon,
        // total_tagihan,
        total_tagihan: Math.max(0, nominal_tagihan - (nominal_diskon || 0)),
        status_tagihan,
        catatan,
        updated_at: new Date().toISOString()
      })
      .eq('id_tagihan', id)
      .select()
      .single();

    if (error) throw error;

    await catatAuditLog(user, 'UPDATE_TAGIHAN', 'tagihan', id, oldData, { ...data, alasan_perubahan });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Cek apakah sudah ada pembayaran
    const { data: alokasi } = await supabaseAdmin
      .from('alokasi_pembayaran')
      .select('id_alokasi')
      .eq('id_tagihan', id);

    if (alokasi && alokasi.length > 0 && user.role !== 'System Owner') {
      return NextResponse.json({ message: 'Tagihan yang sudah memiliki pembayaran tidak dapat dihapus kecuali oleh System Owner' }, { status: 400 });
    }

    const { data: oldData } = await supabaseAdmin.from('tagihan').select('*').eq('id_tagihan', id).single();

    const { error } = await supabaseAdmin.from('tagihan').delete().eq('id_tagihan', id);
    if (error) throw error;

    await catatAuditLog(user, 'DELETE_TAGIHAN', 'tagihan', id, oldData, null);

    return NextResponse.json({ message: 'Tagihan berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
