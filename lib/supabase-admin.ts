import { supabase } from './supabase';

// Alias untuk menjaga kompatibilitas dengan modul yang sudah ada
export const supabaseAdmin = supabase;

if (!supabaseAdmin) {
  console.warn('supabaseAdmin not initialized: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
}
