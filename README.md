# SEWAIN

Aplikasi manajemen sewa.

## Langkah Setup
1. Jalankan `sql/schema.sql` di Supabase SQL Editor.
2. Isi `.env.local` berdasarkan `.env.local.example`.
3. Jalankan `npm install`.
4. Jalankan `npm run dev` untuk coba lokal.

## Deploy ke Vercel
1. `git init`, `git add .`, `git commit -m "Initial commit"`, `git push` ke GitHub.
2. Import repository di Vercel.
3. Tambahkan Environment Variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
4. Klik Deploy.
