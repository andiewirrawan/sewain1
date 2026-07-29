import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    // GET is allowed for all logged in users
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from('pengaturan_aplikasi')
      .select('*')
      .eq('id', 1);

    if (error) throw error;

    const data = settings && settings.length > 0 ? settings[0] : {};
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    // PUT requires Owner or System Owner
    if (!requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { nama_usaha, whatsapp_admin, mata_uang, zona_waktu } = body;

    const { data: oldSettings } = await supabase
      .from('pengaturan_aplikasi')
      .select('*')
      .eq('id', 1);
    
    const oldData = oldSettings && oldSettings.length > 0 ? oldSettings[0] : null;

    const { data: updatedSettings, error } = await supabase
      .from('pengaturan_aplikasi')
      .update({
        nama_usaha,
        whatsapp_admin,
        mata_uang,
        zona_waktu,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select();

    if (error) throw error;
    const data = updatedSettings && updatedSettings.length > 0 ? updatedSettings[0] : null;

    await catatAuditLog(user, 'UPDATE', 'pengaturan_aplikasi', '1', oldData, data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
