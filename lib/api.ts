import { NextResponse } from 'next/server';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function apiError(
  statusCode: number,
  code: string,
  message: string
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: { code, message } }, { status: statusCode });
}

export function apiSuccess<T>(data: T, statusCode: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status: statusCode });
}

export async function requireUser() {
  const { getCurrentUserId } = await import('./auth');
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }
  return userId;
}
