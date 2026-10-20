import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { ModuleGuard } from './module-guard';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

beforeEach(() => {
  replace.mockClear();
});

describe('ModuleGuard', () => {
  it('redirects ppa.user away from legal', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<ModuleGuard module="legal">secret</ModuleGuard>);
    expect(replace).toHaveBeenCalledWith('/forbidden');
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders children for admin', () => {
    useAuthStore.setState({ user: byName('admin'), status: 'authenticated' });
    render(<ModuleGuard module="legal">secret</ModuleGuard>);
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('renders children for a user with access', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(<ModuleGuard module="ppa">ok</ModuleGuard>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
