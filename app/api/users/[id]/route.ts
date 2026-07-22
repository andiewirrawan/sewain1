import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data: oldData } = await supabase.from('users').select('*').eq('id', id).single();
  if (!oldData) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { status, password } = body;

  if (status === 'Nonaktif' && (id === user.id || oldData.role === 'Owner')) {
    return NextResponse.json({ message: 'Anda tidak dapat menonaktifkan diri sendiri atau Owner' }, { status: 400 });
  }

  const updateData: any = {};
  if (body.nama !== undefined) updateData.nama = body.nama;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.status !== undefined) updateData.status = body.status;
  
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: 'Tidak ada data untuk diupdate' });
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'Update User', 'users', id, oldData, updateData);
  
  return NextResponse.json({ message: 'User berhasil diupdate' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  
  if (id === user.id) {
    return NextResponse.json({ message: 'Anda tidak dapat menghapus diri sendiri' }, { status: 400 });
  }

  const { data: targetUser } = await supabase.from('users').select('*').eq('id', id).single();
  if (!targetUser) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

  if (targetUser.role === 'Owner') {
    return NextResponse.json({ message: 'User dengan role Owner tidak boleh dihapus' }, { status: 400 });
  }
  
  // Soft Delete: Ubah status menjadi Nonaktif
  const { error } = await supabase.from('users').update({ status: 'Nonaktif' }).eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'Soft Delete User', 'users', id, targetUser, { status: 'Nonaktif' });
  
  return NextResponse.json({ message: 'User berhasil dinonaktifkan (Soft Delete)' });
}
