const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- STARTING MASTER SEED ---');

  // 1. Users
  const users = [
    { id: '11111111-1111-1111-1111-111111111111', nama: 'Super Admin', email: 'system@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'System Owner', status: 'Aktif' },
    { id: '22222222-2222-2222-2222-222222222222', nama: 'Andie Owner', email: 'owner@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Owner', status: 'Aktif' },
    { id: '33333333-3333-3333-3333-333333333333', nama: 'Budi Admin', email: 'admin@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Admin', status: 'Aktif' },
    { id: '44444444-4444-4444-4444-444444444444', nama: 'Siti Kasir', email: 'kasir@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Kasir', status: 'Aktif' }
  ];
  for (const u of users) {
    const { error } = await supabase.from('users').upsert(u);
    console.log(`User ${u.email}: ${error ? error.message : 'OK'}`);
  }

  // 2. Unit
  const units = [
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', kode_unit: 'A01', kategori: 'Ruko', jenis_unit: 'Type A', nomor_unit: 'A01', harga_sewa: 7500000.00, status_unit: 'Terisi' },
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000002', kode_unit: 'A02', kategori: 'Ruko', jenis_unit: 'Type A', nomor_unit: 'A02', harga_sewa: 7500000.00, status_unit: 'Terisi' },
    { id_unit: 'c2c2c2c2-0000-0000-0000-000000000001', kode_unit: 'B01', kategori: 'Kios', jenis_unit: 'Kios Kecil', nomor_unit: 'B01', harga_sewa: 2500000.00, status_unit: 'Terisi' }
  ];
  for (const u of units) {
    const { error } = await supabase.from('unit').upsert(u);
    console.log(`Unit ${u.kode_unit}: ${error ? error.message : 'OK'}`);
  }

  // 3. Penyewa
  const penyewas = [
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', nama: 'Bambang Kopi', nik: '3201010101010001', whatsapp: '628123456789', kontak_darurat: 'Istri - 08123456788', jenis_usaha: 'F&B' },
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000002', nama: 'Hj Salmah', nik: '3201010101010002', whatsapp: '628121122334', kontak_darurat: 'Anak - 08121122335', jenis_usaha: 'Sembako' },
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000003', nama: 'Hendra Laundry', nik: '3201010101010003', whatsapp: '628134455667', kontak_darurat: 'Adik - 08134455668', jenis_usaha: 'Jasa' }
  ];
  for (const p of penyewas) {
    const { error } = await supabase.from('penyewa').upsert(p);
    console.log(`Penyewa ${p.nama}: ${error ? error.message : 'OK'}`);
  }

  // 4. Kontrak
  const kontraks = [
    { id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000001', nomor_kontrak: 'KTR/202601/001', id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', tanggal_masuk: '2026-01-01', tanggal_jatuh_tempo: 5, status_kontrak: 'Aktif' },
    { id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000002', nomor_kontrak: 'KTR/202601/002', id_unit: 'c1c1c1c1-0000-0000-0000-000000000002', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000002', tanggal_masuk: '2026-01-01', tanggal_jatuh_tempo: 10, status_kontrak: 'Aktif' },
    { id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000003', nomor_kontrak: 'KTR/202601/003', id_unit: 'c2c2c2c2-0000-0000-0000-000000000001', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000003', tanggal_masuk: '2026-01-01', tanggal_jatuh_tempo: 5, status_kontrak: 'Aktif' }
  ];
  for (const k of kontraks) {
    const { error } = await supabase.from('kontrak_sewa').upsert(k);
    console.log(`Kontrak ${k.nomor_kontrak}: ${error ? error.message : 'OK'}`);
  }

  // 5. Promo
  const promos = [
    { id_promo: 'dddddddd-0000-0000-0000-000000000001', nama_promo: 'Promo Grand Opening', jenis_diskon: 'Nominal', nilai_diskon: 500000.00, tanggal_mulai: '2026-01-01', tanggal_selesai: '2026-12-31', status: 'Aktif' }
  ];
  for (const pr of promos) {
    const { error } = await supabase.from('promo').upsert(pr);
    console.log(`Promo ${pr.nama_promo}: ${error ? error.message : 'OK'}`);
  }

  // 6. Tagihan (Simulate generate_tagihan_periode results)
  const tagihans = [
    { id_tagihan: 't1t1t1t1-0000-0000-0000-000000000001', id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000001', periode: '01-2026', jatuh_tempo: '2026-01-05', nominal_tagihan: 7500000.00, total_tagihan: 7500000.00, terbayar: 7500000.00, status_tagihan: 'Lunas' },
    { id_tagihan: 't1t1t1t1-0000-0000-0000-000000000002', id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000002', periode: '01-2026', jatuh_tempo: '2026-01-10', nominal_tagihan: 7500000.00, total_tagihan: 7500000.00, terbayar: 4000000.00, status_tagihan: 'Sebagian' }
  ];
  for (const t of tagihans) {
    const { error } = await supabase.from('tagihan').upsert(t);
    console.log(`Tagihan ${t.periode}: ${error ? error.message : 'OK'}`);
  }

  // 7. Pembayaran
  const pembayarans = [
    { id_pembayaran: 'p1p1p1p1-0000-0000-0000-000000000001', id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000001', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', periode: '01-2026', tanggal_bayar: '2026-01-04', nominal: 7500000.00, metode_pembayaran: 'Transfer BCA' },
    { id_pembayaran: 'p1p1p1p1-0000-0000-0000-000000000002', id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000002', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000002', periode: '01-2026', tanggal_bayar: '2026-01-10', nominal: 4000000.00, metode_pembayaran: 'Tunai' }
  ];
  for (const pay of pembayarans) {
    const { error } = await supabase.from('pembayaran').upsert(pay);
    console.log(`Pembayaran ${pay.id_pembayaran}: ${error ? error.message : 'OK'}`);
  }

  console.log('--- FINAL COUNTS ---');
  const tables = ['users', 'unit', 'penyewa', 'kontrak_sewa', 'tagihan', 'pembayaran'];
  for (const t of tables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${count}`);
  }
}

run();
