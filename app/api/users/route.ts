import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: users, error } = await supabase.from('users').select('id_user, nama, email, role, status');
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Map id_user to id for frontend consistency if needed, or just return as is
  const mappedUsers = users.map(u => ({
    id: u.id_user,
    nama: u.nama,
    email: u.email,
    role: u.role,
    status: u.status
  }));

  return NextResponse.json(mappedUsers);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { nama, email, password, role } = await request.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.from('users').insert({ 
    nama, 
    email, 
    password_hash: hashedPassword, 
    role, 
    status: 'Aktif' 
  }).select().single();
  
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  
  await catatAuditLog(user, 'Create User', 'users', data.id_user, null, { nama, email, role });
  
  return NextResponse.json({ message: 'User berhasil dibuat' });
}
