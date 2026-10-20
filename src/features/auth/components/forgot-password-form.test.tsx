import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { authService } from '../api/auth.service';
import { ForgotPasswordForm } from './forgot-password-form';

describe('ForgotPasswordForm', () => {
  it('shows the neutral sent message after submit', async () => {
    const spy = vi.spyOn(authService, 'forgotPassword').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(lo.auth.username), 'nobody');
    await user.click(screen.getByRole('button', { name: lo.auth.forgotSubmit }));
    expect(await screen.findByText(lo.auth.forgotSent)).toBeVisible();
    expect(spy).toHaveBeenCalledWith({ username: 'nobody' });
  });

  it('shows the neutral message even when the request fails', async () => {
    vi.spyOn(authService, 'forgotPassword').mockRejectedValue(new Error('x'));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(lo.auth.username), 'nobody');
    await user.click(screen.getByRole('button', { name: lo.auth.forgotSubmit }));
    expect(await screen.findByText(lo.auth.forgotSent)).toBeVisible();
  });

  it('shows an error alert, not the sent message, on a network failure', async () => {
    vi.spyOn(authService, 'forgotPassword').mockRejectedValue({
      status: 0,
      code: 'NETWORK',
      message: '',
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(lo.auth.username), 'nobody');
    await user.click(screen.getByRole('button', { name: lo.auth.forgotSubmit }));
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.network);
    expect(screen.queryByText(lo.auth.forgotSent)).not.toBeInTheDocument();
  });

  it('requires a username', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.click(screen.getByRole('button', { name: lo.auth.forgotSubmit }));
    expect(await screen.findByText(lo.validation.usernameRequired)).toBeVisible();
  });
});
