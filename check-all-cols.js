import { supabase } from './lib/supabase.js';
async function run() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0] || {}).join(','));
}
run();
