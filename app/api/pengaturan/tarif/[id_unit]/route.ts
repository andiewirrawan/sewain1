import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id_unit: string }> }
) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id_unit } = await params;
    const { harga_sewa } = await request.json();

    const { data: oldUnit } = await supabase.from('unit').select('*').eq('id_unit', id_unit).single();

    const { error } = await supabase
      .from('unit')
      .update({ harga_sewa })
      .eq('id_unit', id_unit);

    if (error) throw error;

    await catatAuditLog(user, 'Update Tarif', 'unit', id_unit, { harga_sewa: oldUnit.harga_sewa }, { harga_sewa });

    return NextResponse.json({ message: 'Tarif berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
