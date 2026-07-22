import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { role, status } = await request.json();

  const { data: oldData } = await supabase.from('users').select('*').eq('id_user', id).single();

  const { error } = await supabase.from('users').update({ role, status }).eq('id_user', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'Update User', 'users', id, oldData, { role, status });
  
  return NextResponse.json({ message: 'User berhasil diupdate' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  const { data: oldData } = await supabase.from('users').select('*').eq('id_user', id).single();
  
  const { error } = await supabase.from('users').delete().eq('id_user', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'Delete User', 'users', id, oldData, null);
  
  return NextResponse.json({ message: 'User berhasil dihapus' });
}
