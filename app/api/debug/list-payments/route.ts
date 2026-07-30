import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase
    .from('pembayaran')
    .select('id_pembayaran, id_tagihan, nominal, tanggal_bayar')
    .limit(5);

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}
