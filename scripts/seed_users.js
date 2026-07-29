
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedUsers() {
  console.log('Seeding users...');
  const users = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nama: 'Budi Santoso',
      email: 'owner@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'Owner',
      status: 'Aktif',
      is_system_owner: false
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nama: 'Siti Rahmawati',
      email: 'admin@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'Admin',
      status: 'Aktif',
      is_system_owner: false
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      nama: 'Dewa System Owner',
      email: 'system@sewain.com',
      password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', // password123
      role: 'System Owner',
      status: 'Aktif',
      is_system_owner: true
    }
  ];

  for (const user of users) {
    const { error } = await supabase.from('users').upsert(user);
    if (error) {
      console.error(`Error seeding user ${user.email}:`, error.message);
    } else {
      console.log(`User ${user.email} seeded successfully`);
    }
  }
}

seedUsers();
