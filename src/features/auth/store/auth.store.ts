import { create } from 'zustand';
import { setTokenRefreshedHandler, setUnauthorizedHandler } from '@/lib/api/client';
import { normalizeError } from '@/lib/api/errors';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import {
  clearSession,
  hasSessionHint,
  readSessionToken,
  readTokenExpiry,
  setSessionTokens,
} from '@/lib/auth/session';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/domain';
import { authService } from '../api/auth.service';
import { toUser } from '../lib/user-mapper';
import type { LoginInput } from '../schemas/login.schema';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: ApiError | null;
  /** Why the last session ended; lets AuthGate distinguish logout from expiry. */
  endReason: 'logout' | 'expired' | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  fetchMe(): Promise<void>;
  expire(): void;
  updateUser(user: User): void;
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null;

export function clearExpiryTimer(): void {
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

export function scheduleExpiryTimer(token: string): void {
  clearExpiryTimer();
  const exp = readTokenExpiry(token);
  if (exp === null) return;
  const delayMs = exp * 1000 - Date.now();
  if (delayMs <= 0) {
    useAuthStore.getState().expire();
    return;
  }
  if (delayMs < 2147483647) {
    expiryTimer = setTimeout(() => {
      useAuthStore.getState().expire();
    }, delayMs);
  }
}

export function checkFocusExpiry(): void {
  if (useAuthStore.getState().status !== 'authenticated') return;
  const token = readSessionToken();
  if (!token) {
    useAuthStore.getState().expire();
    return;
  }
  const exp = readTokenExpiry(token);
  if (exp !== null && exp * 1000 <= Date.now()) {
    useAuthStore.getState().expire();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('focus', checkFocusExpiry);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: 'idle',
  endReason: null,
  error: null,

  updateUser(user: User) {
    set({ user });
  },

  async login(input) {
    set({ status: 'loading' });
    try {
      const { token, refreshToken, user } = await authService.login(input);
      setSessionTokens({ accessToken: token, refreshToken }, input.remember ?? false);
      scheduleExpiryTimer(token);
      set({ user, status: 'authenticated', endReason: null, error: null });
    } catch (e) {
      set({ user: null, status: 'unauthenticated' });
      throw normalizeError(e);
    }
  },

  async logout() {
    clearExpiryTimer();
    // The backend has no logout endpoint: logging out is purely client-side.
    clearSession();
    runLogoutResets();
    set({ user: null, status: 'unauthenticated', endReason: 'logout', error: null });
  },

  async fetchMe() {
    if (!hasSessionHint()) {
      // No session: skip the request. endReason is kept for AuthGate.
      set({ user: null, status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await authService.me();
      const token = readSessionToken();
      if (token) scheduleExpiryTimer(token);
      set({ user, status: 'authenticated', error: null });
    } catch (e) {
      const err = normalizeError(e);
      if (err.status === 401) {
        clearExpiryTimer();
        clearSession();
        set({ user: null, status: 'unauthenticated', endReason: 'expired', error: null });
      } else {
        // network/timeout/5xx: not an expiry; keep session and cookie untouched
        set({ status: 'error', error: err });
      }
    }
  },

  expire() {
    clearExpiryTimer();
    // Only a genuine mid-session 401; fetchMe/logout own their own transitions.
    if (get().status !== 'authenticated') return;
    clearSession();
    runLogoutResets();
    set({ user: null, status: 'unauthenticated', endReason: 'expired' });
  },
}));

setUnauthorizedHandler(() => useAuthStore.getState().expire());

setTokenRefreshedHandler((token, rawUser) => {
  scheduleExpiryTimer(token);
  if (rawUser) {
    useAuthStore.getState().updateUser(toUser(rawUser));
  } else {
    void useAuthStore.getState().fetchMe();
  }
});
