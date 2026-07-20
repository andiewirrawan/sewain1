import { createClient } from '@supabase/supabase-js';

let _supabase: any;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your-supabase-url' || supabaseServiceKey === 'your-supabase-service-role-key') {
        // Log error but don't throw during build to allow Vercel to pass
        console.error('Supabase configuration is missing or invalid. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Secrets.');
        return undefined;
      }
      _supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return _supabase[prop];
  }
});
