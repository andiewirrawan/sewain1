const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- SEEDING CRITICAL USERS ---');
  const users = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nama: 'Budi Santoso',
      email: 'owner@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'Owner',
      is_system_owner: false,
      status: 'Aktif'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nama: 'Siti Rahmawati',
      email: 'admin@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'Admin',
      is_system_owner: false,
      status: 'Aktif'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      nama: 'Dewa System Owner',
      email: 'system@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'System Owner',
      is_system_owner: true,
      status: 'Aktif'
    }
  ];

  for (const user of users) {
    const { error } = await supabase.from('users').upsert(user);
    if (error) {
      console.error(`Error seeding ${user.email}:`, error.message);
    } else {
      console.log(`Successfully seeded: ${user.email}`);
    }
  }

  console.log('\n--- SEEDING CORE BUSINESS DATA (Simplified SDK version) ---');
  // Seeding Unit
  const units = [
    { id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', kode_unit: 'RUKO-A01', kategori: 'Ruko', jenis_unit: 'Ruko 2 Lantai Utama', nomor_unit: 'A01', harga_sewa: 7500000.00, status_unit: 'Terisi' }
  ];
  await supabase.from('unit').upsert(units);

  // Seeding Penyewa
  const tenants = [
    { id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', nama: 'Bambang Sudarsono', nik: '3171011203850001', email: 'bambang.kopi@gmail.com', whatsapp: '081234567890', kontak_darurat: '081298765432', jenis_usaha: 'Kuliner' }
  ];
  await supabase.from('penyewa').upsert(tenants);

  // Seeding Kontrak
  const contracts = [
    { id_kontrak: 'aaaaaaaa-0000-0000-0000-000000000001', nomor_kontrak: 'KTR-2026-001', id_unit: 'c1c1c1c1-0000-0000-0000-000000000001', id_penyewa: 'bbbbbbbb-0000-0000-0000-000000000001', tanggal_masuk: '2026-01-01', tanggal_jatuh_tempo: 5, status_kontrak: 'Aktif' }
  ];
  await supabase.from('kontrak_sewa').upsert(contracts);

  console.log('Seed completed via SDK.');
}

run();
