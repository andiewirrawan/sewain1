import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Ambil user dari database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'Aktif')
      .single();

    if (error || !user) {
      return NextResponse.json({ message: 'User tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    const dbPassword = user.password || user.password_hash;
    if (!dbPassword) {
      return NextResponse.json({ message: 'Password column missing or empty in database' }, { status: 500 });
    }

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, dbPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    // Generate JWT
    const userId = user.id || user.id_user;
    const token = await generateToken({
      id: userId,
      nama: user.nama,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      token,
      user: {
        id: userId,
        nama: user.nama,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error: ' + (error as any).message }, { status: 500 });
  }
}
