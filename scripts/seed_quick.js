const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iataseagioltnkxvxgik.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGFzZWFnaW9sdG5reHZ4Z2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2NjgzNywiZXhwIjoyMTAwMDQyODM3fQ.ZHjBmWY1j4si-snEYOsfdR74gt6PviFzEi-6OOpnMvo');
async function run() {
  const { error } = await supabase.from('users').upsert({
    id: '11111111-1111-1111-1111-111111111111',
    nama: 'Budi Santoso',
    email: 'owner@sewain.com',
    password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS',
    role: 'Owner',
    status: 'Aktif'
  });
  console.log(error ? error.message : 'Success');
}
run();