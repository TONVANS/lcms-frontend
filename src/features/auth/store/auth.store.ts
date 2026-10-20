import { create } from 'zustand';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { normalizeError } from '@/lib/api/errors';
import { clearMockSession, readMockSession } from '@/lib/auth/session';
import type { User } from '@/types/domain';
import { authService } from '../api/auth.service';
import type { LoginInput } from '../schemas/login.schema';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  /** Why the last session ended; lets AuthGate distinguish logout from expiry. */
  endReason: 'logout' | 'expired' | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  fetchMe(): Promise<void>;
  expire(): void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'idle',
  endReason: null,

  async login(input) {
    set({ status: 'loading' });
    try {
      const user = await authService.login(input);
      set({ user, status: 'authenticated', endReason: null });
    } catch (e) {
      set({ user: null, status: 'unauthenticated' });
      throw normalizeError(e);
    }
  },

  async logout() {
    try {
      await authService.logout();
    } catch {
      // always clear local state, even if the request fails
    }
    clearMockSession();
    set({ user: null, status: 'unauthenticated', endReason: 'logout' });
  },

  async fetchMe() {
    if (readMockSession() === null) {
      // No session: skip the request (a 401 would trigger the refresh/expire flow).
      set({ user: null, status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await authService.me();
      set({ user, status: 'authenticated' });
    } catch {
      clearMockSession();
      set({ user: null, status: 'unauthenticated', endReason: 'expired' });
    }
  },

  expire() {
    clearMockSession();
    set({ user: null, status: 'unauthenticated', endReason: 'expired' });
  },
}));

setUnauthorizedHandler(() => useAuthStore.getState().expire());
