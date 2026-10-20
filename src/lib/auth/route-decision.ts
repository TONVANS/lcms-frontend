import { PUBLIC_ROUTES, ROUTES } from '@/lib/constants/routes';

export function getSafeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}

export function decideRedirect(input: {
  pathname: string;
  search: string;
  hasSession: boolean;
}): string | null {
  const { pathname, search, hasSession } = input;
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (!hasSession) {
    if (isPublic) return null;
    if (pathname === ROUTES.home && !search) return ROUTES.login;
    return `${ROUTES.login}?next=${encodeURIComponent(pathname + search)}`;
  }

  if (pathname === ROUTES.login) {
    // Stale cookie + AuthGate redirect: do not bounce back, avoids a loop.
    if (new URLSearchParams(search).get('reason') === 'expired') return null;
    return ROUTES.home;
  }
  return null;
}
