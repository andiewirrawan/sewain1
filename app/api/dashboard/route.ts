import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  console.log('Dashboard API: Starting request');
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      console.log('Dashboard API: Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Dashboard API: User authorized, fetching data...');
    // ... rest of the code ...
    const now = new Date();
    // ...
    // [Keep the original logic inside, just adding logs]
    const bulanIni = `${now.getMonth() + 1}`.padStart(2, '0');
    const tahunIni = `${now.getFullYear()}`;
    const periodeBulanIni = `${bulanIni}-${tahunIni}`;

    // 1. Data Unit
    console.log('Dashboard API: Fetching unit data...');
    const { data: units, error: unitError } = await supabase.from('unit').select('status_unit, jenis_unit');
    if (unitError) throw unitError;
    const total_unit = units?.length || 0;
    const unit_terisi = units?.filter(u => u.status_unit === 'Terisi').length || 0;
    const unit_kosong = total_unit - unit_terisi;

    console.log('Dashboard API: Fetching kontrak data...');
    // 2. Data Penyewa & Kontrak
    const { data: kontrak, error: kontrakError } = await supabase.from('kontrak_sewa').select('id_kontrak, id_penyewa, tanggal_jatuh_tempo, status_kontrak');
    if (kontrakError) throw kontrakError;
    const kontrak_aktif = kontrak?.filter(k => k.status_kontrak === 'Aktif') || [];
    const penyewa_aktif = new Set(kontrak_aktif.map(k => k.id_penyewa)).size;

    console.log('Dashboard API: Fetching pembayaran data...');
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
    const occupancy_per_jenis = units?.reduce((acc, unit) => {
      if (!acc[unit.jenis_unit]) acc[unit.jenis_unit] = { total: 0, terisi: 0 };
      acc[unit.jenis_unit].total++;
      if (unit.status_unit === 'Terisi') acc[unit.jenis_unit].terisi++;
      return acc;
    }, {} as any);

    // 5. Belum Bayar Bulan Ini
    const pembayaranLunasBulanIni = new Set(
      pembayaran?.filter(p => p.status_pembayaran === 'Lunas' && p.periode === periodeBulanIni).map(p => p.id_kontrak)
    );

    const { data: belum_bayar_bulan_ini } = await supabase
      .from('kontrak_sewa')
      .select('nomor_kontrak, id_penyewa, id_unit, penyewa(nama, whatsapp), unit(kode_unit)')
      .eq('status_kontrak', 'Aktif')
      .not('id_kontrak', 'in', `(${Array.from(pembayaranLunasBulanIni).join(',')})`);

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

    console.log('Dashboard API: Returning data');
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
