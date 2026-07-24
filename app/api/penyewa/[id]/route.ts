import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;

    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('penyewa')
      .select(`
        *,
        kontrak_sewa (
          *,
          unit (*)
        )
      `)
      .eq('id_penyewa', id)
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    const activeContracts = data.kontrak_sewa?.filter((k: any) => k.status_kontrak === 'Aktif') || [];
    const mappedData = {
      ...data,
      status: activeContracts.length > 0 ? 'Aktif' : 'Non-aktif'
    };

    console.log('Data Penyewa dari DB (with dynamic status):', mappedData);
    return NextResponse.json(mappedData);
  } catch (error: any) {
    console.error('Supabase GET error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = await getUserFromRequest(request as any);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Update Body:', body);
    
    // Get existing data for audit log
    const { data: oldData, error: fetchError } = await supabase
      .from('penyewa')
      .select('*')
      .eq('id_penyewa', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('penyewa')
      .update({
        nama: body.nama,
        nik: body.nik,
        alamat: body.alamat,
        whatsapp: body.whatsapp,
        kontak_darurat: body.kontak_darurat,
        jenis_usaha: body.jenis_usaha
      })
      .eq('id_penyewa', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase PUT error:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    console.log('Data Penyewa berhasil diupdate:', data);
    await catatAuditLog(user, 'UPDATE', 'penyewa', id, oldData, data);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const user = await getUserFromRequest(request as any);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Forbidden: Owner only' }, { status: 403 });
    }

    // Get existing data for audit log
    const { data: oldData, error: fetchError } = await supabase
      .from('penyewa')
      .select('*')
      .eq('id_penyewa', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 });
    }
    
    // Validate if penyewa has active contracts
    const { data: activeContracts, error: contractError } = await supabase
      .from('kontrak_sewa')
      .select('id_kontrak')
      .eq('id_penyewa', id)
      .eq('status_kontrak', 'Aktif');
      
    if (contractError) {
      console.error('Contract check error:', contractError);
    }
      
    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json({ 
        message: 'Tidak dapat menghapus penyewa karena masih memiliki kontrak Aktif' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('penyewa')
      .delete()
      .eq('id_penyewa', id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    await catatAuditLog(user, 'DELETE', 'penyewa', id, oldData, null);

    return NextResponse.json({ message: 'Penyewa berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
