-- SQL Migration: Fix Function Security (search_path)

-- Update handle_updated_at to set search_path to public
-- This prevents the "Function Search Path Mutable" warning and increases security.
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql'
SET search_path = public;
