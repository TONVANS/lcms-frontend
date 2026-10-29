import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SUPPORT_CONTACTS, supportMailHref, supportTelHref } from '@/config/support';
import { lo } from '@/lib/i18n/lo';
import { ForgotPasswordForm } from './forgot-password-form';

describe('ForgotPasswordForm (static notice)', () => {
  it('shows the contact-IT notice and no form controls', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('heading', { name: lo.auth.forgotTitle })).toBeVisible();
    expect(screen.getByText(lo.auth.forgotContactIt)).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('links the support phone and email', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('link', { name: SUPPORT_CONTACTS.phone })).toHaveAttribute(
      'href',
      supportTelHref(SUPPORT_CONTACTS.phone),
    );
    expect(screen.getByRole('link', { name: SUPPORT_CONTACTS.email })).toHaveAttribute(
      'href',
      supportMailHref(SUPPORT_CONTACTS.email),
    );
  });

  it('links back to login', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('link', { name: lo.auth.backToLogin })).toHaveAttribute('href', '/login');
  });
});
