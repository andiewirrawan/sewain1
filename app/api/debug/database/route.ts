import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Count
  const { count, error: countError } = await supabase
    .from('pembayaran')
    .select('*', { count: 'exact', head: true });

  // Latest 5 IDs
  const { data: latestData, error: latestError } = await supabase
    .from('pembayaran')
    .select('id_pembayaran')
    .order('tanggal_bayar', { ascending: false })
    .limit(5);

  return NextResponse.json({
    supabaseUrl,
    count,
    ids: latestData?.map((item) => item.id_pembayaran) || [],
    errors: {
      countError,
      latestError
    }
  });
}
