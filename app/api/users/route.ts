import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: users, error } = await supabase.from('users').select('*');
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const mappedUsers = users.map(u => ({
    id: u.id,
    nama: u.nama,
    email: u.email,
    role: u.role,
    status: u.status,
    created_at: u.created_at,
    created_by: u.created_by,
    last_login: u.last_login
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
    password: hashedPassword, 
    role, 
    status: 'Aktif',
    created_by: user.nama
  }).select().single();
  
  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  
  await catatAuditLog(user, 'Create User', 'users', data.id, null, { nama, email, role });
  
  return NextResponse.json({ message: 'User berhasil dibuat' });
}
