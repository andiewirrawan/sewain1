const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.rpc('execute_sql', { sql: `
    ALTER TABLE penyewa ADD COLUMN IF NOT EXISTS nik TEXT;
    ALTER TABLE penyewa ADD COLUMN IF NOT EXISTS alamat TEXT;
    ALTER TABLE penyewa ADD COLUMN IF NOT EXISTS kontak_darurat TEXT;
    ALTER TABLE penyewa ADD COLUMN IF NOT EXISTS jenis_usaha TEXT;
  `});
  console.log(error || data);
}
run();
