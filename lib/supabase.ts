import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your-supabase-url' || supabaseServiceKey === 'your-supabase-service-role-key') {
  throw new Error('Supabase configuration is missing or invalid. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
