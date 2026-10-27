import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't middleware auth routes or API
  if (pathname.startsWith('/api') || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('session');

  // Protected routes require a session
  if (!session && (pathname === '/' || pathname.startsWith('/docs'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
