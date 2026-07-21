const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.rpc('get_schema_info'); // doesn't exist usually
  const { data: d2, error: e2 } = await sb.from('penyewa').select('*').limit(0);
  console.log("Empty result", d2);
}
run();
