const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.from('penyewa').select('*').limit(1);
  console.log(error || data);
}
run();
