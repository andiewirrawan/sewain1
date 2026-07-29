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

  const { data: users } = await supabase.from('users').select('*').eq('id', id);
  const oldData = users && users.length > 0 ? users[0] : null;
  if (!oldData) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const { status, password, role, nama } = body;

  // Validation based on is_system_owner
  if (oldData.is_system_owner) {
    if (status !== undefined && status !== oldData.status) {
      return NextResponse.json({ message: 'Akun System Owner tidak dapat diubah.' }, { status: 403 });
    }
    if (role !== undefined && role !== oldData.role) {
      return NextResponse.json({ message: 'Akun System Owner tidak dapat diubah.' }, { status: 403 });
    }
  }

  // Self-modification constraints
  if (id === user.id) {
    if (status === 'Nonaktif') {
      return NextResponse.json({ message: 'Anda tidak dapat menonaktifkan diri sendiri' }, { status: 400 });
    }
    if (role !== undefined && role !== oldData.role) {
      return NextResponse.json({ message: 'Anda tidak dapat mengubah role diri sendiri' }, { status: 400 });
    }
  }

  // Owner specific constraints
  if (!user.is_system_owner) {
    if (oldData.role === 'Owner' && id !== user.id) {
      return NextResponse.json({ message: 'Anda tidak dapat mengubah data Owner lain' }, { status: 403 });
    }
    if (role === 'Owner' && oldData.role !== 'Owner') {
      return NextResponse.json({ message: 'Anda tidak dapat mengubah role menjadi Owner' }, { status: 403 });
    }
  }

  const updateData: any = {};
  if (nama !== undefined) updateData.nama = nama;
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: 'Tidak ada data untuk diupdate' });
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  let actionName = 'UPDATE_USER';
  if (status && status !== oldData.status) {
    actionName = status === 'Nonaktif' ? 'SOFT_DELETE_USER' : 'RESTORE_USER';
  } else if (role && role !== oldData.role) {
    actionName = 'CHANGE_ROLE';
  } else if (status) {
    actionName = 'CHANGE_STATUS';
  }

  await catatAuditLog(user, actionName, 'users', id, oldData, updateData);
  
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

  const { data: targetUsers } = await supabase.from('users').select('*').eq('id', id);
  const targetUser = targetUsers && targetUsers.length > 0 ? targetUsers[0] : null;
  if (!targetUser) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

  if (targetUser.is_system_owner) {
    return NextResponse.json({ message: 'Akun System Owner tidak dapat diubah.' }, { status: 403 });
  }

  if (!user.is_system_owner && targetUser.role === 'Owner') {
    return NextResponse.json({ message: 'Anda tidak dapat menghapus Owner lain' }, { status: 403 });
  }
  
  // Permanent Delete
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'DELETE_USER_PERMANENT', 'users', id, targetUser, null);
  
  return NextResponse.json({ message: 'User berhasil dihapus permanen' });
}
