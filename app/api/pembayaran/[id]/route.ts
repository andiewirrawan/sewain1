import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log("========== DETAIL PEMBAYARAN ==========");
    console.log("ID:", id);

    // 1. Fetch pembayaran with all related data
    const { data: pembayaran, error: pembayaranError } = await supabase
      .from('pembayaran')
      .select(`
        *,
        tagihan (
          id_kontrak,
          kontrak_sewa (
            *,
            penyewa (*),
            unit (*)
          )
        )
      `)
      .eq('id_pembayaran', id)
      .single();

    if (pembayaranError) {
      console.error("Error fetching pembayaran:", pembayaranError);
      return NextResponse.json({ message: pembayaranError.message }, { status: 500 });
    }

    if (!pembayaran) {
      console.error("Pembayaran tidak ditemukan untuk ID:", id);
      return NextResponse.json({ message: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }

    console.log("Pembayaran:", pembayaran);

    // Construct response to match frontend expectation
    const response = {
      ...pembayaran,
      kontrak_sewa: pembayaran.tagihan?.kontrak_sewa || null
    };
    
    console.log("Response:", response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get old data for audit
    const { data: oldData } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('id_pembayaran', id)
      .single();

    const { data, error } = await supabase
      .from('pembayaran')
      .update(body)
      .eq('id_pembayaran', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Pembayaran untuk periode ini sudah ada.' }, { status: 409 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'UPDATE', 'pembayaran', id, oldData, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'Owner' && user.role !== 'System Owner') {
      return NextResponse.json({ message: 'Forbidden: Owner only' }, { status: 403 });
    }

    const { id } = await params;

    // Get old data for audit
    const { data: oldData } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('id_pembayaran', id)
      .single();

    const { error } = await supabase
      .from('pembayaran')
      .delete()
      .eq('id_pembayaran', id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'DELETE', 'pembayaran', id, oldData, null);

    return NextResponse.json({ message: 'Pembayaran berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
