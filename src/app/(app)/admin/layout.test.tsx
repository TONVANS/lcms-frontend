import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import AdminLayout from './layout';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

describe('AdminLayout', () => {
  beforeEach(() => replace.mockClear());

  it('renders children for an admin', () => {
    useAuthStore.setState({ user: byName('admin'), status: 'authenticated' });
    render(<AdminLayout>secret</AdminLayout>);
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects a non-admin to /forbidden and renders nothing', () => {
    useAuthStore.setState({ user: byName('gc.user'), status: 'authenticated' });
    render(<AdminLayout>secret</AdminLayout>);
    expect(screen.queryByText('secret')).toBeNull();
    expect(replace).toHaveBeenCalledWith('/forbidden');
  });
});
