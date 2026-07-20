import { supabase } from './supabase';

export async function generateNomorKontrak(tanggal_masuk: string): Promise<string> {
  const date = new Date(tanggal_masuk);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `KTR-${year}${month}-`;

  const { data, error } = await supabase
    .from('kontrak_sewa')
    .select('nomor_kontrak')
    .like('nomor_kontrak', `${prefix}%`)
    .order('nomor_kontrak', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating nomor kontrak:', error);
    throw new Error('Gagal menggenerate nomor kontrak');
  }

  let urutan = 1;
  if (data && data.length > 0) {
    const lastNomor = data[0].nomor_kontrak;
    const lastUrutan = parseInt(lastNomor.split('-')[2], 10);
    if (!isNaN(lastUrutan)) {
      urutan = lastUrutan + 1;
    }
  }

  return `${prefix}${String(urutan).padStart(4, '0')}`;
}
