import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, signToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { apiError, apiSuccess } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = await signToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return apiSuccess({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    console.error('Login error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An error occurred');
  }
}
