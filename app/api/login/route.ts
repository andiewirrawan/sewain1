import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import { bootstrapSystem } from '@/lib/bootstrap';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Email:', email);

    if (!email || !password) {
      console.log('Failure: Missing email or password');
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Jalankan bootstrap otomatis jika diperlukan
    await bootstrapSystem();

    // Ambil user dari database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'Aktif')
      .single();

    if (error) {
      console.log('Supabase error searching user:', error.message);
    }

    if (!user) {
      console.log('Failure: User not found or inactive');
      return NextResponse.json({ message: 'User tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    console.log('User found:', user.email);
    console.log('User status:', user.status);
    console.log('User role:', user.role);

    const dbPassword = user.password;
    console.log('DB Password Hash exists:', !!dbPassword);

    if (!dbPassword) {
      console.log('Failure: Password column missing or empty in database');
      return NextResponse.json({ message: 'Password column missing or empty in database' }, { status: 500 });
    }

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, dbPassword);
    console.log('bcrypt.compare result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Failure: Incorrect password');
      return NextResponse.json({ message: 'Password salah' }, { status: 401 });
    }

    // Generate JWT
    const userId = user.id;
    console.log('User ID for JWT:', userId);
    
    const token = await generateToken({
      id: userId,
      nama: user.nama,
      email: user.email,
      role: user.role,
      is_system_owner: user.role === 'System Owner' || user.is_system_owner === true,
    });

    console.log('JWT Token generated successfully');
    return NextResponse.json({
      token,
      user: {
        id: userId,
        nama: user.nama,
        role: user.role,
        is_system_owner: user.role === 'System Owner' || user.is_system_owner === true,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error: ' + (error as any).message }, { status: 500 });
  }
}
