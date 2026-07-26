const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Seeding Unit
  const units = [
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', kode_unit: 'A01', kategori: 'Ruko', jenis_unit: 'Type A', nomor_unit: 'A01', harga_sewa: 7500000.00, status_unit: 'Kosong' },
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000002', kode_unit: 'A02', kategori: 'Ruko', jenis_unit: 'Type A', nomor_unit: 'A02', harga_sewa: 7500000.00, status_unit: 'Kosong' },
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000003', kode_unit: 'A03', kategori: 'Ruko', jenis_unit: 'Type B', nomor_unit: 'A03', harga_sewa: 8000000.00, status_unit: 'Kosong' }
  ];
  
  console.log('Seeding units...');
  for (const u of units) {
    const { error } = await supabase.from('unit').upsert(u);
    console.log(`Unit ${u.kode_unit}: ${error ? error.message : 'OK'}`);
  }

  // Seeding Penyewa
  const penyewas = [
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', nama: 'Bambang Kopi', nik: '3201010101010001', whatsapp: '628123456789', kontak_darurat: 'Istri - 08123456788' },
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000002', nama: 'Hj Salmah', nik: '3201010101010002', whatsapp: '628121122334', kontak_darurat: 'Anak - 08121122335' }
  ];

  console.log('Seeding penyewas...');
  for (const p of penyewas) {
    const { error } = await supabase.from('penyewa').upsert(p);
    console.log(`Penyewa ${p.nama}: ${error ? error.message : 'OK'}`);
  }

  // Seeding Kontrak
  const kontraks = [
    { id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000001', nomor_kontrak: 'KTR/202601/001', id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', tanggal_masuk: '2026-01-01', tanggal_jatuh_tempo: 5, status_kontrak: 'Aktif' }
  ];

  console.log('Seeding kontraks...');
  for (const k of kontraks) {
    const { error } = await supabase.from('kontrak_sewa').upsert(k);
    console.log(`Kontrak ${k.nomor_kontrak}: ${error ? error.message : 'OK'}`);
  }
}

run();
