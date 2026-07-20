import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { data: users } = await supabase.from('users').select('id, nama, email, role, status');
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { nama, email, password, role } = await request.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from('users').insert({ nama, email, password: hashedPassword, role, status: 'Aktif' });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ message: 'User berhasil dibuat' });
}
