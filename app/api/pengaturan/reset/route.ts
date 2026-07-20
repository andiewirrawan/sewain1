import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { konfirmasi } = await request.json();
  if (konfirmasi !== 'HAPUS SEMUA DATA') return NextResponse.json({ message: 'Konfirmasi salah' }, { status: 400 });

  const tables = ['pembayaran', 'kontrak_sewa', 'penyewa', 'unit'];
  const ringkasan: any = {};

  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    ringkasan[table] = count;
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Assuming ID field exists and delete all
  }

  await catatAuditLog(user, 'Delete', 'RESET_ALL', 'all', ringkasan, null);
  return NextResponse.json({ message: 'Data berhasil direset' });
}
