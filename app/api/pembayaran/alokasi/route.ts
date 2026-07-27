import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    // Strict requirement for Owner or System Owner
    if (!requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('alokasi_pembayaran')
      .select(`
        id_alokasi,
        nominal_alokasi,
        created_at,
        pembayaran (
          tanggal_bayar,
          metode_pembayaran,
          penyewa (
            nama
          )
        ),
        tagihan (
          periode,
          kontrak_sewa (
            unit (
              kode_unit
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten the data for easier consumption
    const flattenedData = data.map((item: any) => ({
      id: item.id_alokasi,
      tanggal_bayar: item.pembayaran?.tanggal_bayar,
      penyewa: item.pembayaran?.penyewa?.nama,
      unit: item.tagihan?.kontrak_sewa?.unit?.kode_unit,
      periode_tagihan: item.tagihan?.periode,
      nominal_alokasi: item.nominal_alokasi,
      metode: item.pembayaran?.metode_pembayaran,
      created_at: item.created_at
    }));

    return NextResponse.json(flattenedData);
  } catch (error: any) {
    console.error('Error fetching alokasi:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
