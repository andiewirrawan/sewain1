const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient('https://iataseagioltnkxvxgik.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGFzZWFnaW9sdG5reHZ4Z2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2NjgzNywiZXhwIjoyMTAwMDQyODM3fQ.ZHjBmWY1j4si-snEYOsfdR74gt6PviFzEi-6OOpnMvo');
async function run() {
  const schema = fs.readFileSync('schema.sql', 'utf8');
  const { error: schemaError } = await supabase.rpc('execute_sql', { sql: schema }).catch(e => ({ error: { message: 'RPC execute_sql not found' } }));
  if (schemaError) console.log('Schema Error:', schemaError.message);
  
  // Since we can't use raw SQL easily without RPC, let's at least seed the users via SDK
  const users = [
    { id: '11111111-1111-1111-1111-111111111111', nama: 'Budi Santoso', email: 'owner@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Owner', status: 'Aktif', is_system_owner: false },
    { id: '22222222-2222-2222-2222-222222222222', nama: 'Siti Rahmawati', email: 'admin@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Admin', status: 'Aktif', is_system_owner: false },
    { id: '33333333-3333-3333-3333-333333333333', nama: 'Dewa System Owner', email: 'system@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'System Owner', status: 'Aktif', is_system_owner: true }
  ];
  for (const u of users) {
    const { error } = await supabase.from('users').upsert(u);
    console.log(u.email, error ? error.message : 'Success');
  }
}
run();