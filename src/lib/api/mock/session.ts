import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { readMockSession } from '@/lib/auth/session';
import type { User } from '@/types/domain';

/** The user behind the current mock session cookie, or null when signed out. */
export function getMockSessionUser(): User | null {
  const username = readMockSession();
  return username ? (MOCK_USERS.find((u) => u.username === username) ?? null) : null;
}
