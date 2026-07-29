-- SQL Migration: Fix Supabase Linter Warnings (Security Search Path)
-- This fixes the "function_search_path_mutable" warning for all custom functions.

-- 1. handle_updated_at
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 2. generate_tagihan_periode
ALTER FUNCTION public.generate_tagihan_periode(text, uuid) SET search_path = public;

-- 3. get_generate_preview
ALTER FUNCTION public.get_generate_preview(text) SET search_path = public;

-- 4. proses_pembayaran_fifo
ALTER FUNCTION public.proses_pembayaran_fifo(uuid, uuid, text, date, numeric, text, uuid, text) SET search_path = public;

-- 5. get_auth_user_role
ALTER FUNCTION public.get_auth_user_role() SET search_path = public;

-- 6. is_system_owner
ALTER FUNCTION public.is_system_owner() SET search_path = public;

-- 7. is_owner
ALTER FUNCTION public.is_owner() SET search_path = public;

-- 8. has_operational_access
ALTER FUNCTION public.has_operational_access() SET search_path = public;
