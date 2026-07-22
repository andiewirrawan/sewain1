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
    console.log("Fetching payment Detail. ID =", id);

    // 1. Fetch pembayaran
    const { data: pembayaran, error: pembayaranError } = await supabase
      .from('pembayaran')
      .select('*')
      .eq('id_pembayaran', id)
      .single();

    if (pembayaranError || !pembayaran) {
      console.error("Error fetching pembayaran:", pembayaranError);
      return NextResponse.json({ message: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }
    console.log("pembayaran =", pembayaran);

    // 2. Fetch kontrak
    const { data: kontrak, error: kontrakError } = await supabase
      .from('kontrak_sewa')
      .select('*')
      .eq('id_kontrak', pembayaran.id_kontrak)
      .single();

    if (kontrakError || !kontrak) {
      console.error("Error fetching kontrak:", kontrakError);
    }
    console.log("kontrak =", kontrak);

    // 3. Fetch unit & penyewa (if kontrak exists)
    let unit = null;
    let penyewa = null;

    if (kontrak) {
        const { data: uData } = await supabase.from('unit').select('*').eq('id_unit', kontrak.id_unit).single();
        unit = uData;
        console.log("unit =", unit);

        const { data: pData } = await supabase.from('penyewa').select('*').eq('id_penyewa', kontrak.id_penyewa).single();
        penyewa = pData;
        console.log("penyewa =", penyewa);
    }

    return NextResponse.json({
      ...pembayaran,
      kontrak_sewa: kontrak ? {
          ...kontrak,
          unit,
          penyewa
      } : null
    });
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

    if (user.role !== 'Owner') {
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
