import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface UserPayload {
  id: string;
  nama: string;
  email: string;
  role: 'Owner' | 'Admin';
}

export async function generateToken(payload: UserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserPayload;
  } catch (error) {
    return null;
  }
}

export function requireRole(user: UserPayload | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export async function getUserFromRequest(req: NextRequest): Promise<UserPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}
