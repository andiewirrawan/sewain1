import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { data, error } = await supabase
      .from('unit')
      .select(`
        *,
        kontrak_sewa (
          *,
          penyewa (*)
        )
      `)
      .eq('id_unit', id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const { data: oldData } = await supabase.from('unit').select('*').eq('id_unit', id).single();

    const { data, error } = await supabase
      .from('unit')
      .update(body)
      .eq('id_unit', id)
      .select()
      .single();

    if (error) throw error;

    await catatAuditLog(user, 'UPDATE', 'unit', id, oldData, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const { data: oldData } = await supabase.from('unit').select('*').eq('id_unit', id).single();

    const { error } = await supabase.from('unit').delete().eq('id_unit', id);

    if (error) throw error;

    await catatAuditLog(user, 'DELETE', 'unit', id, oldData, null);

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
