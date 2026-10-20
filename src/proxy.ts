import { NextResponse, type NextRequest } from 'next/server';
import { decideRedirect } from '@/lib/auth/route-decision';
import { SESSION_COOKIE } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? SESSION_COOKIE;
  const hasSession = Boolean(request.cookies.get(cookieName)?.value);
  const { pathname, search } = request.nextUrl;
  const target = decideRedirect({ pathname, search, hasSession });
  if (target) return NextResponse.redirect(new URL(target, request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/|.*\\..*).*)'],
};
