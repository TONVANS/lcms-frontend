import { env } from '@/config/env';

export const SESSION_COOKIE = 'lcms_session';

const THIRTY_DAYS = 2592000;

export function setMockSession(username: string, remember: boolean): void {
  if (typeof document === 'undefined') return;
  let cookie = `${SESSION_COOKIE}=${encodeURIComponent(`mock:${username}`)}; path=/; SameSite=Lax`;
  if (remember) cookie += `; max-age=${THIRTY_DAYS}`;
  document.cookie = cookie;
}

export function readMockSession(): string | null {
  if (typeof document === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      const value = decodeURIComponent(rest.join('='));
      return value.startsWith('mock:') ? value.slice(5) || null : null;
    }
  }
  return null;
}

export function clearMockSession(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
}

/**
 * Whether a session may exist. Mock mode: the mock cookie is readable. Live mode: the
 * session cookie is httpOnly and unreadable, the proxy guarantees it on protected
 * routes, and the backend is the authority, so always true.
 */
export function hasSessionHint(): boolean {
  return env.NEXT_PUBLIC_API_MODE === 'mock' ? readMockSession() !== null : true;
}
