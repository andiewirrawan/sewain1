import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('penyewa')
      .select(`
        *,
        kontrak_sewa (
          status_kontrak,
          unit (
            kode_unit,
            
          )
        )
      `)
      .order('nama', { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const mappedData = data.map((penyewa: any) => {
      const activeContracts = penyewa.kontrak_sewa?.filter((k: any) => k.status_kontrak === 'Aktif') || [];
      const unitList = activeContracts.map((k: any) => k.unit?.kode_unit || '-').join(', ');
      
      return {
        ...penyewa,
        unit_saat_ini: unitList || '-',
        status: activeContracts.length > 0 ? 'Aktif' : 'Non-aktif'
      };
    });

    return NextResponse.json(mappedData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, whatsapp, email } = body;

    // Required fields based on UI form (even if we don't save all to DB)
    if (!nama || !whatsapp) {
      return NextResponse.json({ message: 'Nama dan WhatsApp wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('penyewa')
      .insert([
        {
          nama,
          whatsapp,
          email: email || null
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'CREATE', 'penyewa', data.id_penyewa, null, data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
