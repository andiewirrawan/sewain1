const { SignJWT } = require('jose');

async function run() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
  const token = await new SignJWT({
    id_user: 'test',
    username: 'test',
    role: 'admin'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret);

  console.log("Token:", token);
}
run();
