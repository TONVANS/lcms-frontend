import { PUBLIC_ROUTES, ROUTES } from '@/lib/constants/routes';

export function getSafeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  // Control chars, whitespace and backslashes are stripped/normalised by URL parsers.
  if (/[\x00-\x20\x7f\\]/.test(next)) return null;
  try {
    if (new URL(next, 'http://x').origin !== 'http://x') return null;
  } catch {
    return null;
  }
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
    // Stale cookie or just-logged-out (cookie may linger until the POST lands): do not bounce back.
    const reason = new URLSearchParams(search).get('reason');
    if (reason === 'expired' || reason === 'logout') return null;
    return ROUTES.home;
  }
  return null;
}
