import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { AuthGate } from './auth-gate';

const replace = vi.fn();
const clearMockSession = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/ppa',
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('@/lib/auth/session', () => ({ clearMockSession: () => clearMockSession() }));

const admin = MOCK_USERS.find((u) => u.role === 'admin')!;
const fetchMe = vi.fn(async () => {});

beforeEach(() => {
  replace.mockClear();
  clearMockSession.mockClear();
  fetchMe.mockClear();
  search = '';
  useAuthStore.setState({
    user: null,
    status: 'idle',
    endReason: null,
    error: null,
    fetchMe,
  });
});

describe('AuthGate', () => {
  it('fetches me when idle and shows skeleton', () => {
    const { container } = render(<AuthGate>child</AuthGate>);
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('child')).toBeNull();
  });

  it('shows skeleton without fetching while loading', () => {
    useAuthStore.setState({ status: 'loading' });
    const { container } = render(<AuthGate>child</AuthGate>);
    expect(fetchMe).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('redirects to login with reason=expired and next when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated', endReason: 'expired' });
    const { container } = render(<AuthGate>child</AuthGate>);
    expect(clearMockSession).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/login?reason=expired&next=%2Fppa');
    expect(screen.queryByText('child')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the search string in next', () => {
    search = 'a=1';
    useAuthStore.setState({ status: 'unauthenticated', endReason: null });
    render(<AuthGate>child</AuthGate>);
    expect(replace).toHaveBeenCalledWith(
      '/login?reason=expired&next=' + encodeURIComponent('/ppa?a=1'),
    );
  });

  it('redirects plainly to /login after an explicit logout', () => {
    useAuthStore.setState({ status: 'unauthenticated', endReason: 'logout' });
    render(<AuthGate>child</AuthGate>);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated', user: admin });
    render(<AuthGate>child</AuthGate>);
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows an error banner with retry and does not redirect on error', async () => {
    const error = { status: 0, code: 'NETWORK', message: 'x' } as never;
    useAuthStore.setState({ status: 'error', error });
    render(<AuthGate>child</AuthGate>);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText('child')).toBeNull();
    expect(screen.getByText(toUserMessage(error))).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: lo.common.retry }));
    expect(fetchMe).toHaveBeenCalledTimes(1);
  });
});
