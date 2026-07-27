import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const bulanIni = `${now.getMonth() + 1}`.padStart(2, '0');
    const tahunIni = `${now.getFullYear()}`;
    const periodeBulanIni = `${bulanIni}-${tahunIni}`;

    // 1. Data Unit & Occupancy
    const { data: units, error: unitError } = await supabaseAdmin
      .from('unit')
      .select('id_unit, status_unit, jenis_unit, kontrak_sewa(status_kontrak)');
    
    if (unitError) throw unitError;

    const processedUnits = units?.map(u => {
      const hasActiveContract = Array.isArray(u.kontrak_sewa)
        ? u.kontrak_sewa.some((k: any) => k.status_kontrak === 'Aktif')
        : (u.kontrak_sewa?.status_kontrak === 'Aktif');
      
      return { ...u, is_occupied: hasActiveContract };
    }) || [];

    const total_unit = processedUnits.length;
    const unit_terisi = processedUnits.filter(u => u.is_occupied).length;
    const unit_kosong = total_unit - unit_terisi;

    // 2. Data Penyewa Aktif
    const { data: kontrakAktif, error: kontrakError } = await supabaseAdmin
      .from('kontrak_sewa')
      .select('id_penyewa')
      .eq('status_kontrak', 'Aktif');
    
    if (kontrakError) throw kontrakError;
    const penyewa_aktif = new Set(kontrakAktif.map(k => k.id_penyewa)).size;

    // 3. Data Pendapatan dari Alokasi Pembayaran
    // Pendapatan dihitung dari uang yang MASUK bulan ini (berdasarkan tanggal bayar)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const { data: payMonth } = await supabaseAdmin
      .from('pembayaran')
      .select('nominal')
      .gte('tanggal_bayar', startOfMonth)
      .eq('status_pembayaran', 'Lunas');

    const { data: payYear } = await supabaseAdmin
      .from('pembayaran')
      .select('nominal')
      .gte('tanggal_bayar', startOfYear)
      .eq('status_pembayaran', 'Lunas');

    const pendapatan_bulan_ini = payMonth?.reduce((sum, p) => sum + Number(p.nominal || 0), 0) || 0;
    const pendapatan_tahun_ini = payYear?.reduce((sum, p) => sum + Number(p.nominal || 0), 0) || 0;

    // 4. Tunggakan (Berdasarkan Tabel Tagihan)
    // Piutang dihitung dari tagihan yang statusnya BUKAN Lunas, Dibatalkan, atau Write Off
    const { data: allUnpaid, error: errTunggakan } = await supabaseAdmin
      .from('tagihan')
      .select('total_tagihan, terbayar, jatuh_tempo, status_tagihan')
      .not('status_tagihan', 'in', '("Lunas","Dibatalkan","Write Off")');

    if (errTunggakan) throw errTunggakan;

    const total_piutang = allUnpaid?.reduce((sum, t) => sum + (Number(t.total_tagihan) - Number(t.terbayar)), 0) || 0;
    const jumlah_tagihan_tertunggak = allUnpaid?.length || 0;

    // Aging Piutang (Keterlambatan sejak Jatuh Tempo)
    const aging_piutang = {
      "Lancar": 0,    // Belum jatuh tempo
      "1-7 Hari": 0,
      "8-30 Hari": 0,
      ">30 Hari": 0
    };

    allUnpaid?.forEach(t => {
      const value = Number(t.total_tagihan) - Number(t.terbayar);
      const jt = new Date(t.jatuh_tempo);
      
      // Reset jam ke 0 untuk perbandingan tanggal yang akurat
      const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const d2 = new Date(jt.getFullYear(), jt.getMonth(), jt.getDate());
      
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        aging_piutang["Lancar"] += value;
      } else if (diffDays <= 7) {
        aging_piutang["1-7 Hari"] += value;
      } else if (diffDays <= 30) {
        aging_piutang["8-30 Hari"] += value;
      } else {
        aging_piutang[">30 Hari"] += value;
      }
    });

    // 5. Belum Bayar Periode Ini
    const { data: belum_bayar_bulan_ini } = await supabaseAdmin
      .from('tagihan')
      .select(`
        periode,
        kontrak_sewa (
          nomor_kontrak,
          penyewa (nama, whatsapp),
          unit (kode_unit)
        )
      `)
      .eq('periode', periodeBulanIni)
      .neq('status_tagihan', 'Lunas');

    // 6. Occupancy per Jenis
    const occupancy_per_jenis = processedUnits.reduce((acc, unit) => {
      if (!acc[unit.jenis_unit]) acc[unit.jenis_unit] = { total: 0, terisi: 0 };
      acc[unit.jenis_unit].total++;
      if (unit.is_occupied) acc[unit.jenis_unit].terisi++;
      return acc;
    }, {} as any);

    return NextResponse.json({
      total_unit, 
      unit_terisi, 
      unit_kosong, 
      penyewa_aktif, 
      kontrak_aktif: kontrakAktif.length, 
      pendapatan_bulan_ini, 
      pendapatan_tahun_ini,
      total_piutang,
      jumlah_tagihan_tertunggak,
      aging_piutang,
      occupancy_per_jenis,
      belum_bayar_bulan_ini: belum_bayar_bulan_ini?.map(b => ({
        ...b.kontrak_sewa,
        periode: b.periode
      })) || []
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
