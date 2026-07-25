-- Migration: Menambahkan System Owner
-- Tabel: users

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_system_owner BOOLEAN NOT NULL DEFAULT FALSE;

-- Set user pertama atau admin spesifik sebagai System Owner
UPDATE users 
SET is_system_owner = TRUE, role = 'Owner' 
WHERE email = 'admin@supabase.com';
