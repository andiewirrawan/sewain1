import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function run() {
  const token = await new SignJWT({ id: '123', nama: 'Owner', email: 'owner@test.com', role: 'Owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secretKey);

  const res = await fetch('http://localhost:3000/api/users', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  const data = await res.json();
  console.log("Keys:", Object.keys(data[0] || {}).join(','));
}
run().catch(console.error);
