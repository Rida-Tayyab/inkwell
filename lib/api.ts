import { NextResponse } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

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
