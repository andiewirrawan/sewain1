import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest, requireRole } from '@/lib/auth';
import { catatAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { getPagination, formatPaginatedResponse } from '@/lib/pagination';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !requireRole(user, ['Owner'])) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'Semua';
  const status = searchParams.get('status') || 'Semua';

  const { from, to } = getPagination(page, limit);

  let query = supabase.from('users').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role !== 'Semua') {
    query = query.eq('role', role);
  }
  if (status !== 'Semua') {
    query = query.eq('status', status);
  }

  const { data: users, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

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

  return NextResponse.json(formatPaginatedResponse(mappedUsers, count || 0, page, limit));
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
