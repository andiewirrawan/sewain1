import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'System Owner') {
      return NextResponse.json({ message: 'Unauthorized: Hanya System Owner yang dapat menjalankan migrasi ulang' }, { status: 401 });
    }

    // 1. Ambil semua penyewa
    const { data: allPenyewa } = await supabaseAdmin.from('penyewa').select('id_penyewa');
    if (!allPenyewa) throw new Error('Gagal mengambil data penyewa');

    // 2. Reset Alokasi & Status Tagihan
    await supabaseAdmin.from('alokasi_pembayaran').delete().neq('id_alokasi', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('tagihan').update({ terbayar: 0, status_tagihan: 'Belum Bayar' }).neq('id_tagihan', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('penyewa').update({ saldo_titipan: 0 }).neq('id_penyewa', '00000000-0000-0000-0000-000000000000');

    const results = [];

    for (const p of allPenyewa) {
      // Ambil semua tagihan penyewa ini
      const { data: tagihanList } = await supabaseAdmin
        .from('tagihan')
        .select('*, kontrak_sewa!inner(id_penyewa)')
        .eq('kontrak_sewa.id_penyewa', p.id_penyewa);
      
      // Ambil semua pembayaran penyewa ini
      const { data: pembayaranList } = await supabaseAdmin
        .from('pembayaran')
        .select('*')
        .eq('id_penyewa', p.id_penyewa)
        .order('tanggal_bayar', { ascending: true });

      if (!tagihanList || !pembayaranList) continue;

      // Sort Tagihan FIFO (Periode)
      const sortedTagihan = tagihanList.sort((a, b) => {
        const [ma, ya] = a.periode.split('-');
        const [mb, yb] = b.periode.split('-');
        return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
      });

      let currentSaldoTitipan = 0;

      for (const pay of pembayaranList) {
        let sisaNominal = parseFloat(pay.nominal);
        
        for (const t of sortedTagihan) {
          const total = parseFloat(t.total_tagihan);
          const currentTerbayar = parseFloat(t.terbayar || 0);
          
          if (currentTerbayar < total) {
            const kurang = total - currentTerbayar;
            const alokasi = Math.min(sisaNominal, kurang);
            
            if (alokasi > 0) {
              await supabaseAdmin.from('alokasi_pembayaran').insert([{
                id_pembayaran: pay.id_pembayaran,
                id_tagihan: t.id_tagihan,
                nominal_alokasi: alokasi
              }]);
              
              t.terbayar = currentTerbayar + alokasi;
              const newStatus = Math.abs(t.terbayar - total) < 0.01 ? 'Lunas' : 'Sebagian';
              await supabaseAdmin.from('tagihan').update({
                terbayar: t.terbayar,
                status_tagihan: newStatus
              }).eq('id_tagihan', t.id_tagihan);
              
              sisaNominal -= alokasi;
            }
          }
        }

        if (sisaNominal > 0.01) {
          currentSaldoTitipan += sisaNominal;
        }
      }

      if (currentSaldoTitipan > 0) {
        await supabaseAdmin.from('penyewa').update({ saldo_titipan: currentSaldoTitipan }).eq('id_penyewa', p.id_penyewa);
      }

      results.push({ id_penyewa: p.id_penyewa, pembayaran: pembayaranList.length, tagihan: tagihanList.length });
    }

    await catatAuditLog(user, 'MIGRATE_FIFO_RESET_REALLOCATE', 'multiple', user.id, null, { results });

    return NextResponse.json({ message: 'Migrasi FIFO selesai', results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
