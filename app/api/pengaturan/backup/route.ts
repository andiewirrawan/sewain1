import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const tables = ['unit', 'penyewa', 'kontrak_sewa', 'pembayaran'];
  const backup: any = {};

  for (const table of tables) {
    const { data } = await supabase.from(table).select('*');
    backup[table] = data;
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename=backup_sewain.json',
    },
  });
}
