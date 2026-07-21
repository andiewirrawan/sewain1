const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const data = await res.json();
  console.log(Object.keys(data.definitions));
}
run();
