# Project Memory: SEWAIN

## Project Overview
- **Name**: SEWAIN
- **Description**: Property Management System for rentals with ERP style UI.
- **Stack**: Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS.

## Database Context
- **Primary Database**: Supabase (PostgreSQL).
- **Schema**: Defined in `schema.sql`. Includes tables for `users`, `unit`, `penyewa`, `kontrak_sewa`, `promo`, `tagihan`, `pembayaran`, `audit_log`, etc.
- **Authentication**: Handled via Supabase Auth, linked to the `public.users` table.

## Important Reference IDs
These IDs are verified in the database and should be used for seeding or audit logs:
- **System Owner**: `11111111-1111-1111-1111-111111111111`
- **Owner**: `caf7d1dd-46f1-48c3-9807-c2662360af9e`
- **Admin**: `7ff7e514-183d-43f6-bc2a-7ce813ede100`

## Development Rules & Lessons
- **UUID Formatting**: Always use standard RFC 4122 UUID v4 formats. Avoid custom prefixes like `p000...` which cause syntax errors (`22P02`).
- **Audit Logs**: The `audit_log` table has a foreign key constraint on `id_user`. Ensure any dummy data for logs uses one of the verified IDs above.
- **Seeding Strategy**: To avoid "duplicate key" errors (`23505`), ensure seed scripts use `ON CONFLICT (id) DO NOTHING` or similar logic, or truncate tables before insertion.
- **Persistence**: Dummy data is managed in `dummy-data.sql` and `seed.sql`.

## API Keys
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used for direct database access in maintenance scripts.
