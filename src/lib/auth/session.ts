export const SESSION_COOKIE = 'lcms_session';
export const REFRESH_COOKIE = 'lcms_refresh';

const THIRTY_DAYS = 2592000;

/**
 * Decodes the JWT payload `exp` without cryptographic verification (the server verifies).
 * Returns the epoch seconds (e.g. 1761800000), or null for mock tokens / malformed JWTs.
 */
export function readTokenExpiry(token: string): number | null {
  if (!token || token.startsWith('mock:')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Stores the bearer token (live: the raw JWT; mock: `mock:<username>`) in the
 * JS-readable session cookie. `max-age` only when "remember me", capped by token expiry.
 */
export function setSessionToken(token: string, remember = false): void {
  if (typeof document === 'undefined') return;
  let cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  if (typeof location !== 'undefined' && location.protocol === 'https:') cookie += '; Secure';

  const exp = readTokenExpiry(token);
  if (remember) {
    let maxAge = THIRTY_DAYS;
    if (exp !== null) {
      const nowSec = Math.floor(Date.now() / 1000);
      maxAge = Math.min(maxAge, Math.max(0, exp - nowSec));
    }
    cookie += `; max-age=${maxAge}`;
  } else if (exp !== null) {
    const nowSec = Math.floor(Date.now() / 1000);
    const maxAge = Math.max(0, exp - nowSec);
    cookie += `; max-age=${maxAge}`;
  }
  document.cookie = cookie;
}

export function setRefreshToken(refreshToken: string, remember = false): void {
  if (typeof document === 'undefined') return;
  let cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; path=/; SameSite=Lax`;
  if (typeof location !== 'undefined' && location.protocol === 'https:') cookie += '; Secure';
  if (remember) {
    cookie += `; max-age=${THIRTY_DAYS}`;
  }
  document.cookie = cookie;
}

export function setSessionTokens(
  tokens: { accessToken: string; refreshToken?: string },
  remember = false,
): void {
  setSessionToken(tokens.accessToken, remember);
  if (tokens.refreshToken) {
    setRefreshToken(tokens.refreshToken, remember);
  }
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

export function readRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFRESH_COOKIE) {
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
  document.cookie = `${REFRESH_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
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
