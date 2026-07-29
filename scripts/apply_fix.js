const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySql(filename) {
  console.log(`Applying ${filename}...`);
  const sql = fs.readFileSync(filename, 'utf8');
  
  // Try to execute the SQL
  // We use .rpc('execute_sql') which is a common helper in Supabase setups for raw SQL
  const { error } = await supabase.rpc('execute_sql', { sql });
  
  if (error) {
    console.error(`Error applying ${filename}:`, error.message);
    if (error.message.includes('execute_sql')) {
      console.error('TIP: The "execute_sql" RPC function might not exist in your Supabase project.');
      console.error('Please create it in the Supabase SQL Editor:');
      console.error(`
create or replace function execute_sql(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;
      `);
    }
    return false;
  }
  
  console.log(`${filename} applied successfully.`);
  return true;
}

async function run() {
  const schemaOk = await applySql('schema.sql');
  if (schemaOk) {
    await applySql('seed.sql');
  } else {
    console.log('Skipping seed.sql due to schema error.');
    
    // Fallback: try to at least seed the users via standard API if tables might exist
    console.log('Attempting fallback user seeding via Supabase API...');
    const users = [
      { id: '11111111-1111-1111-1111-111111111111', nama: 'Super Admin', email: 'system@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'System Owner', is_system_owner: true, status: 'Aktif' },
      { id: '22222222-2222-2222-2222-222222222222', nama: 'Andie Owner', email: 'owner@sewain.com', password: '$2a$10$7vN3gW.Y5YvLdJpE7uJ80e3qB9/u1B9G8zM8G4a9uY9cZ0vE6s7qS', role: 'Owner', is_system_owner: false, status: 'Aktif' }
    ];
    
    for (const user of users) {
      const { error } = await supabase.from('users').upsert(user);
      if (error) {
        console.error(`Failed to upsert user ${user.email}:`, error.message);
      } else {
        console.log(`Successfully upserted user ${user.email}`);
      }
    }
  }
}

run();
