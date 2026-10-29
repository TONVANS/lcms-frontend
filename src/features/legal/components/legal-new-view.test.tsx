import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { lo } from '@/lib/i18n/lo';
import type { SystemModule } from '@/types/domain';
import { LegalNewView } from './legal-new-view';

const nav = vi.hoisted(() => ({ search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/legal/new',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

function login(modules: SystemModule[]) {
  const base = MOCK_USERS.find((u) => u.username === 'legal.user')!;
  useAuthStore.setState({ user: { ...base, accessibleModules: modules }, status: 'authenticated' });
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  nav.search = '';
});

describe('LegalNewView', () => {
  it('offers both record types with both SystemModules', () => {
    login(['legal-documents', 'legal-cases']);
    render(<LegalNewView />);
    expect(screen.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseRegulation) })).toHaveAttribute(
      'href',
      '/legal/new?kind=regulation',
    );
    expect(screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseCase) })).toHaveAttribute(
      'href',
      '/legal/new?kind=case',
    );
  });

  it('offers only documents without legal-cases, and only cases without legal-documents', () => {
    login(['legal-documents']);
    const { unmount } = render(<LegalNewView />);
    expect(screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseRegulation) })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: new RegExp(lo.legal.wizard.chooseCase) })).toBeNull();
    unmount();
    login(['legal-cases']);
    render(<LegalNewView />);
    expect(screen.queryByRole('link', { name: new RegExp(lo.legal.wizard.chooseRegulation) })).toBeNull();
    expect(screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseCase) })).toBeInTheDocument();
  });

  it('falls back to the chooser when the requested wizard is not accessible', () => {
    login(['legal-documents']);
    nav.search = 'kind=case';
    render(<LegalNewView />);
    expect(screen.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeInTheDocument();
  });

  it('opens the requested wizard when accessible', async () => {
    login(['legal-documents', 'legal-cases']);
    nav.search = 'kind=case';
    render(<LegalNewView />);
    expect(screen.getByRole('heading', { level: 1, name: lo.legal.wizard.cases.title })).toBeInTheDocument();
  });
});
