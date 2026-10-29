import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import { homeService } from '../api/home.service';
import type { HomeData } from '../types';
import { HomeView } from './home-view';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const card = (module: 'ppa' | 'gc' | 'legal') => ({
  ok: true as const,
  card: {
    module,
    metrics: [{ id: 'total', label: lo.home.stats.total, value: 5 }],
  },
});

const full: HomeData = {
  modules: { ppa: card('ppa'), gc: card('gc'), legal: card('legal') },
  upcoming: [
    {
      key: 'gc:1',
      module: 'gc',
      title: 'Contract One',
      number: 'N-1',
      expirationDate: '2099-01-01',
      href: '/contracts/1',
    },
  ],
  upcomingFailed: false,
};

function login(username: string) {
  const user = MOCK_USERS.find((u) => u.username === username)!;
  useAuthStore.setState({ user, status: 'authenticated' });
}

function loginMulti() {
  const base = MOCK_USERS.find((u) => u.username === 'gc.user')!;
  useAuthStore.setState({
    user: { ...base, accessibleModules: ['power-contracts', 'contracts', 'support'] },
    status: 'authenticated',
  });
}

let load: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.restoreAllMocks();
  replace.mockClear();
  load = vi.spyOn(homeService, 'load').mockResolvedValue(structuredClone(full));
});

const cards = () => screen.findAllByRole('link', { name: lo.home.openModule });

describe('HomeView', () => {
  it('admin sees three module cards and the upcoming link', async () => {
    login('admin');
    render(<HomeView />);
    expect(await cards()).toHaveLength(3);
    const link = await screen.findByRole('link', { name: /Contract One/ });
    expect(link).toHaveAttribute('href', '/contracts/1');
    expect(screen.getByRole('link', { name: lo.home.viewAllAlerts })).toHaveAttribute(
      'href',
      '/notifications',
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it('a user with two modules sees exactly those cards', async () => {
    loginMulti();
    render(<HomeView />);
    const links = await cards();
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/ppa', '/contracts']);
  });

  it('redirects a single-module user to their module', async () => {
    login('ppa.user');
    const { container } = render(<HomeView />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/ppa'));
    expect(container).toBeEmptyDOMElement();
    expect(load).not.toHaveBeenCalled();
  });

  it('none.user sees an empty state linking to /support and loads nothing', () => {
    login('none.user');
    render(<HomeView />);
    expect(screen.getByText(lo.home.noModulesTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lo.home.contactSupport })).toHaveAttribute(
      'href',
      '/support',
    );
    expect(replace).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });

  it('a failed module shows an inline error with retry; others still render', async () => {
    login('admin');
    const data = structuredClone(full);
    data.modules.gc = { ok: false };
    load.mockResolvedValueOnce(data);
    render(<HomeView />);
    const retry = await screen.findByRole('button', { name: lo.common.retry });
    expect(screen.getByRole('alert')).toHaveTextContent(lo.home.moduleLoadError);
    expect(await cards()).toHaveLength(3);
    await userEvent.click(retry);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(load).toHaveBeenCalledTimes(2);
  });
});
