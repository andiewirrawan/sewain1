import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get promo detail and list of assigned tenants
    const { data: promo, error: promoError } = await supabase
      .from('promo')
      .select(`
        *,
        promo_penyewa (
          id_penyewa,
          penyewa (
            id_penyewa,
            nama,
            nik,
            whatsapp
          )
        )
      `)
      .eq('id_promo', id)
      .single();

    if (promoError) {
      return NextResponse.json({ message: promoError.message }, { status: 404 });
    }

    // Get usage statistics
    const { data: usage, error: usageError } = await supabase
      .from('pembayaran')
      .select(`
        id_pembayaran,
        tanggal_bayar,
        nominal_diskon,
        total_tagihan,
        kontrak_sewa (
          penyewa (
            nama
          )
        )
      `)
      .eq('id_promo', id);

    if (usageError) {
      console.error('Error fetching promo usage:', usageError);
    }

    const totalPotongan = usage?.reduce((sum: number, p: any) => sum + (p.nominal_diskon || 0), 0) || 0;

    return NextResponse.json({
      ...promo,
      riwayat_penggunaan: usage || [],
      total_potongan: totalPotongan
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nama_promo, jenis_diskon, nilai_diskon, tanggal_mulai, tanggal_selesai, status, deskripsi, id_penyewa_list, prioritas } = body;

    const { data: oldPromo } = await supabase.from('promo').select('*').eq('id_promo', id).single();

    const { data: promo, error: promoError } = await supabase
      .from('promo')
      .update({ 
        nama_promo, 
        jenis_diskon, 
        nilai_diskon: nilai_diskon !== undefined ? parseFloat(nilai_diskon) : undefined, 
        tanggal_mulai, 
        tanggal_selesai, 
        status, 
        deskripsi,
        prioritas: prioritas !== undefined ? parseInt(prioritas) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id_promo', id)
      .select()
      .single();

    if (promoError) {
      return NextResponse.json({ message: promoError.message }, { status: 500 });
    }

    // Update tenant assignments if list provided
    if (id_penyewa_list && Array.isArray(id_penyewa_list)) {
      // Simple approach: delete all and re-insert
      await supabase.from('promo_penyewa').delete().eq('id_promo', id);
      
      if (id_penyewa_list.length > 0) {
        const assignments = id_penyewa_list.map((idPenyewa: string) => ({
          id_promo: id,
          id_penyewa: idPenyewa
        }));
        await supabase.from('promo_penyewa').insert(assignments);
      }
    }

    await catatAuditLog(user, 'UPDATE_PROMO', 'promo', id, oldPromo, promo);
    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const { data: promo } = await supabase.from('promo').select('*').eq('id_promo', id).single();

    // Soft delete: change status to 'Tidak Aktif' instead of actual delete
    const { error } = await supabase
      .from('promo')
      .update({ status: 'Tidak Aktif', updated_at: new Date().toISOString() })
      .eq('id_promo', id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'DELETE_PROMO_SOFT', 'promo', id, promo, { ...promo, status: 'Tidak Aktif' });
    return NextResponse.json({ message: 'Promo berhasil dinonaktifkan (Soft Delete)' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
