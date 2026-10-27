import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcryptjs from 'bcryptjs';

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || '');

if (SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

export async function signToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function hashPassword(password: string): string {
  return bcryptjs.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcryptjs.compareSync(password, hash);
}
