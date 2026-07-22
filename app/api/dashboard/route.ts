import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const bulanIni = `${now.getMonth() + 1}`.padStart(2, '0');
    const tahunIni = `${now.getFullYear()}`;
    const periodeBulanIni = `${bulanIni}-${tahunIni}`;

    // 1. Data Unit & Kontrak for Occupancy Source of Truth
    const { data: units, error: unitError } = await supabase.from('unit').select('id_unit, status_unit, jenis_unit, kontrak_sewa(status_kontrak)');
    if (unitError) throw unitError;

    const processedUnits = units?.map(u => {
      const hasActiveContract = Array.isArray(u.kontrak_sewa)
        ? u.kontrak_sewa.some((k: any) => k.status_kontrak === 'Aktif')
        : (u.kontrak_sewa?.status_kontrak === 'Aktif');
      
      return {
        ...u,
        is_occupied: hasActiveContract
      };
    }) || [];

    const total_unit = processedUnits.length;
    const unit_terisi = processedUnits.filter(u => u.is_occupied).length;
    const unit_kosong = total_unit - unit_terisi;

    // 2. Data Penyewa & Kontrak
    const { data: kontrak, error: kontrakError } = await supabase.from('kontrak_sewa').select('id_kontrak, id_penyewa, tanggal_jatuh_tempo, status_kontrak');
    if (kontrakError) throw kontrakError;
    const kontrak_aktif = kontrak?.filter(k => k.status_kontrak === 'Aktif') || [];
    const penyewa_aktif = new Set(kontrak_aktif.map(k => k.id_penyewa)).size;

    // 3. Data Pembayaran
    const { data: pembayaran, error: payError } = await supabase.from('pembayaran').select('id_pembayaran, id_kontrak, nominal, status_pembayaran, periode');
    if (payError) throw payError;
    
    const pendapatan_bulan_ini = pembayaran
      ?.filter(p => p.status_pembayaran === 'Lunas' && p.periode === periodeBulanIni)
      .reduce((sum, p) => sum + (p.nominal || 0), 0) || 0;

    const pendapatan_tahun_ini = pembayaran
      ?.filter(p => p.status_pembayaran === 'Lunas' && p.periode?.endsWith(tahunIni))
      .reduce((sum, p) => sum + (p.nominal || 0), 0) || 0;

    // 4. Occupancy per Jenis
    const occupancy_per_jenis = processedUnits.reduce((acc, unit) => {
      if (!acc[unit.jenis_unit]) acc[unit.jenis_unit] = { total: 0, terisi: 0 };
      acc[unit.jenis_unit].total++;
      if (unit.is_occupied) acc[unit.jenis_unit].terisi++;
      return acc;
    }, {} as any);

    // 5. Belum Bayar Bulan Ini
    const pembayaranLunasBulanIni = new Set(
      pembayaran?.filter(p => p.status_pembayaran === 'Lunas' && p.periode === periodeBulanIni).map(p => p.id_kontrak)
    );

    let query = supabase
      .from('kontrak_sewa')
      .select('nomor_kontrak, id_penyewa, id_unit, penyewa(nama, whatsapp), unit(kode_unit)')
      .eq('status_kontrak', 'Aktif');

    if (pembayaranLunasBulanIni.size > 0) {
      query = query.not('id_kontrak', 'in', `(${Array.from(pembayaranLunasBulanIni).join(',')})`);
    }

    const { data: belum_bayar_bulan_ini } = await query;

    // 6. Jatuh Tempo Minggu Ini
    const mingguDepan = new Date();
    mingguDepan.setDate(now.getDate() + 7);
    
    const { data: jatuh_tempo_minggu_ini } = await supabase
      .from('kontrak_sewa')
      .select('nomor_kontrak, tanggal_jatuh_tempo, penyewa(nama), unit(kode_unit)')
      .eq('status_kontrak', 'Aktif')
      .gte('tanggal_jatuh_tempo', now.toISOString().split('T')[0])
      .lte('tanggal_jatuh_tempo', mingguDepan.toISOString().split('T')[0]);

    // Tunggakan: kontrak aktif yang punya pembayaran "Terlambat" atau "Belum Bayar" di periode berjalan
    const tunggakan_bulan_ini = pembayaran?.filter(p => p.periode === periodeBulanIni && (p.status_pembayaran === 'Belum Bayar' || p.status_pembayaran === 'Terlambat')).length || 0;

    return NextResponse.json({
      total_unit, unit_terisi, unit_kosong, penyewa_aktif, kontrak_aktif: kontrak_aktif.length, 
      tunggakan_bulan_ini, pendapatan_bulan_ini, pendapatan_tahun_ini,
      occupancy_per_jenis, belum_bayar_bulan_ini, jatuh_tempo_minggu_ini
    });
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
