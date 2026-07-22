import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { konfirmasi } = await request.json();
  if (konfirmasi !== 'HAPUS SEMUA DATA') return NextResponse.json({ message: 'Konfirmasi salah' }, { status: 400 });

  const tables = [
    { name: 'pembayaran', idField: 'id_pembayaran' },
    { name: 'kontrak_sewa', idField: 'id_kontrak' },
    { name: 'penyewa', idField: 'id_penyewa' },
    { name: 'unit', idField: 'id_unit' }
  ];

  const ringkasan: any = {};

  for (const table of tables) {
    const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true });
    ringkasan[table.name] = count;
    // Delete all records by matching all IDs that are not a non-existent UUID
    await supabase.from(table.name).delete().neq(table.idField, '00000000-0000-0000-0000-000000000000');
  }

  await catatAuditLog(user, 'RESET_ALL', 'all', 'all', ringkasan, null);
  return NextResponse.json({ message: 'Data berhasil direset' });
}
