import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { MOCK_USERS } from '../mocks/auth.mock';
import { useAuthStore } from '../store/auth.store';
import { LoginForm } from './login-form';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const userByName = (username: string) => MOCK_USERS.find((u) => u.username === username)!;

function mockLogin(username: string) {
  const login = vi.fn(async () => {
    useAuthStore.setState({ user: userByName(username), status: 'authenticated' });
  });
  useAuthStore.setState({ login });
  return login;
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(lo.auth.username), 'someone');
  await user.type(screen.getByLabelText(lo.auth.password), 'password');
  await user.click(screen.getByRole('button', { name: lo.auth.submit }));
}

beforeEach(() => {
  replace.mockClear();
  useAuthStore.setState({ user: null, status: 'unauthenticated', endReason: null, error: null });
});

describe('LoginForm', () => {
  it('shows Lao validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: lo.auth.submit }));
    expect(await screen.findByText(lo.validation.usernameRequired)).toBeVisible();
    expect(screen.getByText(lo.validation.passwordRequired)).toBeVisible();
  });

  it('redirects to safe next after login', async () => {
    const user = userEvent.setup();
    mockLogin('admin');
    render(<LoginForm next="/legal" />);
    await fillAndSubmit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/legal'));
  });

  it('ignores unsafe next and uses landing route', async () => {
    const user = userEvent.setup();
    mockLogin('ppa.user');
    render(<LoginForm next="//evil.com" />);
    await fillAndSubmit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/ppa'));
  });

  it('uses landing route when no next', async () => {
    const user = userEvent.setup();
    mockLogin('multi.user');
    render(<LoginForm />);
    await fillAndSubmit(user);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('shows invalid-credentials message in role=alert', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      login: vi.fn().mockRejectedValue({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }),
    });
    render(<LoginForm />);
    await fillAndSubmit(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(lo.errors.invalidCredentials);
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows session-expired banner when reason=expired', () => {
    render(<LoginForm reason="expired" />);
    expect(screen.getByRole('status')).toHaveTextContent(lo.auth.sessionExpired);
  });

  it('toggles password visibility with labelled button', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const input = screen.getByLabelText(lo.auth.password);
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: lo.auth.showPassword }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: lo.auth.hidePassword }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
