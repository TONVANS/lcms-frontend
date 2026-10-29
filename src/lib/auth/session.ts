export const SESSION_COOKIE = 'lcms_session';

const THIRTY_DAYS = 2592000;

/**
 * Stores the bearer token (live: the raw JWT; mock: `mock:<username>`) in the
 * JS-readable session cookie. `max-age` only when "remember me".
 */
export function setSessionToken(token: string, remember: boolean): void {
  if (typeof document === 'undefined') return;
  let cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  if (typeof location !== 'undefined' && location.protocol === 'https:') cookie += '; Secure';
  if (remember) cookie += `; max-age=${THIRTY_DAYS}`;
  document.cookie = cookie;
}

/** The raw cookie value (both modes), or null when absent. */
export function readSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      const raw = rest.join('=');
      if (raw === '') return null;
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
}

export function setMockSession(username: string, remember: boolean): void {
  setSessionToken(`mock:${username}`, remember);
}

export function readMockSession(): string | null {
  const token = readSessionToken();
  return token !== null && token.startsWith('mock:') ? token.slice(5) || null : null;
}

export const clearMockSession = clearSession;

/** Whether a session may exist: the session cookie is present (both modes). */
export function hasSessionHint(): boolean {
  return readSessionToken() !== null;
}
