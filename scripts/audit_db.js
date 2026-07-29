
const { createClient } = require('@supabase/supabase-js');
async function checkDb() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tables = ['users', 'unit', 'penyewa'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(table, count || error?.message);
  }
}
checkDb();
