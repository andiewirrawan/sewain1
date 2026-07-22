const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

async function run() {
  const id = 'cbf9d6af-b362-4a4d-8c5e-9e7659506b48';
  
  console.log('--- Checking Payment Table ---');
  const { data: pembayaran, error: pError } = await sb
    .from('pembayaran')
    .select('*')
    .eq('id_pembayaran', id);
    
  if (pError) console.error('Error fetching payment:', pError);
  else console.log('Payment rows found:', pembayaran.length);

  console.log('\n--- Checking Audit Logs (id_data) ---');
  const { data: logs, error: lError } = await sb
    .from('audit_log')
    .select('*')
    .eq('id_data', id);

  if (lError) console.error('Error fetching logs:', lError);
  else console.log('Logs found:', JSON.stringify(logs, null, 2));

  console.log('\n--- Checking Audit Logs (data_lama contains ID) ---');
  // This is a bit harder with Supabase JS if it's JSONB, but let's try a simple select
  const { data: logs2, error: lError2 } = await sb
    .from('audit_log')
    .select('*')
    .limit(10);
  
  if (lError2) console.error('Error fetching logs2:', lError2);
  else {
    const found = logs2.filter(log => 
      JSON.stringify(log.data_lama).includes(id) || 
      JSON.stringify(log.data_baru).includes(id)
    );
    console.log('Logs matching ID in JSON:', JSON.stringify(found, null, 2));
  }
}
run();
