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
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'Aktif');

    if (error) {
      console.error('DATABASE ERROR:', error.message);
      return NextResponse.json({ message: 'Database error' }, { status: 500 });
    }

    const userCount = users ? users.length : 0;
    console.log(`USER SEARCH RESULT: Found ${userCount} active user(s) for email ${email}`);

    const user = users && users.length > 0 ? users[0] : null;

    if (!user) {
      console.log('FAILURE: User not found or not active (status must be "Aktif")');
      return NextResponse.json({ message: 'User tidak ditemukan atau tidak aktif' }, { status: 401 });
    }

    console.log('USER DATA FROM DB:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      has_password: !!user.password
    });

    const dbPassword = user.password;
    if (!dbPassword) {
      console.error('FAILURE: Password column is empty for user', user.email);
      return NextResponse.json({ message: 'Data password tidak ditemukan di database' }, { status: 500 });
    }

    // Cek password
    console.log('Verifying password with bcrypt...');
    const isPasswordValid = await bcrypt.compare(password, dbPassword);
    console.log('BCRYPT COMPARE RESULT:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('FAILURE: Password mismatch for email', email);
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
