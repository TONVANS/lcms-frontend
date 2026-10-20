import { create } from 'zustand';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { normalizeError } from '@/lib/api/errors';
import { clearMockSession, hasSessionHint } from '@/lib/auth/session';
import type { ApiError } from '@/types/api';
import type { User } from '@/types/domain';
import { authService } from '../api/auth.service';
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
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: 'idle',
  endReason: null,
  error: null,

  async login(input) {
    set({ status: 'loading' });
    try {
      const user = await authService.login(input);
      set({ user, status: 'authenticated', endReason: null, error: null });
    } catch (e) {
      set({ user: null, status: 'unauthenticated' });
      throw normalizeError(e);
    }
  },

  async logout() {
    // Clear local state first so a failing/401 request cannot race with it.
    clearMockSession();
    set({ user: null, status: 'unauthenticated', endReason: 'logout', error: null });
    try {
      await authService.logout();
    } catch {
      // best-effort: the user is already logged out locally; server session expires on its own
    }
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
      set({ user, status: 'authenticated', error: null });
    } catch (e) {
      const err = normalizeError(e);
      if (err.status === 401) {
        clearMockSession();
        set({ user: null, status: 'unauthenticated', endReason: 'expired', error: null });
      } else {
        // network/timeout/5xx: not an expiry; keep session and cookie untouched
        set({ status: 'error', error: err });
      }
    }
  },

  expire() {
    // Only a genuine mid-session 401; fetchMe/logout own their own transitions.
    if (get().status !== 'authenticated') return;
    clearMockSession();
    set({ user: null, status: 'unauthenticated', endReason: 'expired' });
  },
}));

setUnauthorizedHandler(() => useAuthStore.getState().expire());
