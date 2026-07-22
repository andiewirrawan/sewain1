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

    console.log("params.id =", id);

    const { data, error } = await supabase
      .from('pembayaran')
      .select(`
        *,
        kontrak_sewa (
          *,
          unit (*),
          penyewa (*)
        )
      `)
      .eq('id_pembayaran', id)
      .single();

    console.log("result =", data);
    console.log("error =", error);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
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
