import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // 1. Cek apakah ada pembayaran
    const { data: alokasi } = await supabaseAdmin
      .from('alokasi_pembayaran')
      .select('id_alokasi')
      .eq('id_tagihan', id);

    if (alokasi && alokasi.length > 0) {
      return NextResponse.json({ message: 'Tagihan tidak dapat diedit karena sudah memiliki pembayaran.' }, { status: 400 });
    }

    // 2. Cek status tagihan
    const { data: oldData, error: fetchError } = await supabaseAdmin.from('tagihan').select('*').eq('id_tagihan', id).single();
    if (fetchError) throw fetchError;
    if (oldData.status_tagihan !== 'Belum Bayar') {
      return NextResponse.json({ message: 'Tagihan hanya dapat diedit jika status "Belum Bayar".' }, { status: 400 });
    }

    const body = await req.json();
    const { jatuh_tempo, nominal_tagihan, nominal_diskon, catatan } = body;

    const { data, error } = await supabaseAdmin
      .from('tagihan')
      .update({
        jatuh_tempo,
        nominal_tagihan,
        nominal_diskon,
        total_tagihan: Math.max(0, nominal_tagihan - (nominal_diskon || 0)),
        catatan,
        updated_at: new Date().toISOString()
      })
      .eq('id_tagihan', id)
      .select()
      .single();

    if (error) throw error;

    await catatAuditLog(user, 'UPDATE_TAGIHAN', 'tagihan', id, oldData, { ...data, alasan_perubahan: body.alasan_perubahan });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Cek apakah sudah ada pembayaran
    const { data: alokasi } = await supabaseAdmin
      .from('alokasi_pembayaran')
      .select('id_alokasi')
      .eq('id_tagihan', id);

    if (alokasi && alokasi.length > 0) {
      return NextResponse.json({ message: 'Tagihan tidak dapat dihapus karena sudah memiliki transaksi pembayaran.' }, { status: 400 });
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
