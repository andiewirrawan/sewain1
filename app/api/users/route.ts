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
    is_system_owner: u.is_system_owner,
    created_at: u.created_at
  }));

  return NextResponse.json(formatPaginatedResponse(mappedUsers, count || 0, page, limit));
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user || !requireRole(user, ['Owner'])) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/users request body:", body, "by user:", user.email);

    const { nama, email, password, role } = body;

    // Validation
    if (!nama || !email || !password || !role) {
      const missing = [];
      if (!nama) missing.push('nama');
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (!role) missing.push('role');
      return NextResponse.json({ message: `Data tidak lengkap. Field yang kurang: ${missing.join(', ')}` }, { status: 400 });
    }

    if (role !== 'Owner' && role !== 'Admin') {
      return NextResponse.json({ message: 'Role tidak valid.' }, { status: 400 });
    }

    if (role === 'Owner' && !user.is_system_owner) {
      return NextResponse.json({ message: 'Hanya System Owner yang dapat membuat Owner baru' }, { status: 403 });
    }

    // Check duplicate email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "Not Found" in Supabase
      console.error("Check email error:", checkError);
      return NextResponse.json({ 
        message: 'Gagal mengecek email', 
        error: checkError.message 
      }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah digunakan.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertData = { 
      nama, 
      email, 
      password: hashedPassword, 
      role, 
      status: 'Aktif',
      is_system_owner: false
    };

    console.log("Executing Supabase insert into users:", insertData);

    const { data, error } = await supabase.from('users').insert(insertData).select().single();
    
    if (error) {
      console.error("Supabase insert error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      // Handle unique constraint manually just in case
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Email sudah digunakan.' }, { status: 409 });
      }
      return NextResponse.json({ 
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }
    
    await catatAuditLog(user, 'CREATE_USER', 'users', data.id, null, { nama, email, role });
    
    return NextResponse.json({ message: 'User berhasil dibuat' });
  } catch (error: any) {
    console.error("POST /api/users caught exception:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server internal.", error: error.message, stack: error.stack }, { status: 500 });
  }
}
