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
    { name: 'alokasi_pembayaran', idField: 'id_alokasi' },
    { name: 'log_wa_tagihan', idField: 'id_log' },
    { name: 'pembayaran', idField: 'id_pembayaran' },
    { name: 'tagihan', idField: 'id_tagihan' },
    { name: 'riwayat_generate_tagihan', idField: 'id_generate' },
    { name: 'promo_penyewa', idField: 'id' },
    { name: 'promo', idField: 'id_promo' },
    { name: 'kontrak_sewa', idField: 'id_kontrak' },
    { name: 'penyewa', idField: 'id_penyewa' },
    { name: 'unit', idField: 'id_unit' }
  ];

  const ringkasan: any = {};

  for (const table of tables) {
    const { count } = await supabase.from(table.name).select('*', { count: 'exact', head: true });
    ringkasan[table.name] = count || 0;
    
    const { error } = await supabase
      .from(table.name)
      .delete()
      .neq(table.idField, '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`Gagal meriset tabel ${table.name}:`, error);
      return NextResponse.json(
        { message: `Gagal menghapus data tabel ${table.name}: ${error.message}` },
        { status: 500 }
      );
    }
  }

  await catatAuditLog(user, 'RESET_ALL', 'all', 'all', ringkasan, null);
  return NextResponse.json({ message: 'Seluruh data berhasil direset secara permanen' });
}
