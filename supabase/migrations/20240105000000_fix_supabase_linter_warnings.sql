-- SQL Migration: Fix Supabase Linter Warnings (Security Search Path & Execution Rights)
-- This fixes "function_search_path_mutable" and "security_definer_function_executable" warnings.

-- 1. handle_updated_at (Switch to INVOKER as it doesn't need elevated rights)
ALTER FUNCTION public.handle_updated_at() SECURITY INVOKER SET search_path = public;

-- 2. Revoke public execute rights for SECURITY DEFINER functions to prevent REST API exposure
-- This satisfies 0028_anon_security_definer_function_executable and 0029_authenticated_security_definer_function_executable
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;

-- 3. Set search_path for other functions
ALTER FUNCTION public.generate_tagihan_periode(text, uuid) SET search_path = public;
ALTER FUNCTION public.get_generate_preview(text) SET search_path = public;
ALTER FUNCTION public.proses_pembayaran_fifo(uuid, uuid, text, date, numeric, text, uuid, text) SET search_path = public;
ALTER FUNCTION public.get_auth_user_role() SET search_path = public;
ALTER FUNCTION public.is_system_owner() SET search_path = public;
ALTER FUNCTION public.is_owner() SET search_path = public;
ALTER FUNCTION public.has_operational_access() SET search_path = public;

-- 4. Revoke public execute on sensitive logic functions
REVOKE EXECUTE ON FUNCTION public.generate_tagihan_periode(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_generate_preview(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.proses_pembayaran_fifo(uuid, uuid, text, date, numeric, text, uuid, text) FROM PUBLIC;
