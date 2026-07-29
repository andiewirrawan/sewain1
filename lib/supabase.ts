import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Instance tunggal Supabase client
// Menggunakan Service Role Key karena digunakan di API route untuk akses penuh
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
