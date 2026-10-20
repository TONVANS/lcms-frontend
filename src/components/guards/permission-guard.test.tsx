import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { PermissionGuard } from './permission-guard';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

beforeEach(() => {
  replace.mockClear();
});

describe('PermissionGuard', () => {
  it('redirects to /forbidden', () => {
    useAuthStore.setState({ user: byName('gc.viewer'), status: 'authenticated' });
    render(
      <PermissionGuard module="gc" permission="create">
        secret
      </PermissionGuard>,
    );
    expect(replace).toHaveBeenCalledWith('/forbidden');
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders children with permission', () => {
    useAuthStore.setState({ user: byName('gc.editor'), status: 'authenticated' });
    render(
      <PermissionGuard module="gc" permission="create">
        ok
      </PermissionGuard>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('hides children and redirects on logout', () => {
    useAuthStore.setState({ user: byName('gc.editor'), status: 'authenticated' });
    render(
      <PermissionGuard module="gc" permission="create">
        ok
      </PermissionGuard>,
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
    act(() => useAuthStore.setState({ user: null, status: 'unauthenticated' }));
    expect(screen.queryByText('ok')).toBeNull();
    expect(replace).toHaveBeenCalledWith('/forbidden');
  });
});
