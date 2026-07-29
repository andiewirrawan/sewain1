import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { periode, jatuh_tempo, preview } = body;

    if (!periode) {
      return NextResponse.json({ message: 'Periode wajib diisi' }, { status: 400 });
    }

    if (preview) {
      const { data: stats, error: statsError } = await supabaseAdmin.rpc('get_generate_preview', {
        p_periode: periode
      });
      if (statsError) throw statsError;
      return NextResponse.json(stats);
    }

    if (!jatuh_tempo) {
      return NextResponse.json({ message: 'Tanggal Jatuh Tempo wajib diisi' }, { status: 400 });
    }

    // Call PostgreSQL Function (RPC) for safe, transactional generation
    const { data, error } = await supabaseAdmin.rpc('generate_tagihan_periode', {
      p_periode: periode,
      p_user_id: user.id
    });

    if (error) throw error;
    
    const result = data as any;
    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    await catatAuditLog(user, 'GENERATE_TAGIHAN_RPC', 'riwayat_generate_tagihan', periode, null, result);

    return NextResponse.json({ 
      message: `Berhasil membuat ${result.count || 0} tagihan`,
      count: result.count
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
