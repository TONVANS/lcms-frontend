import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { lo } from '@/lib/i18n/lo';
import type { HomeSummary } from '../types';
import { homeService } from '../api/home.service';
import { HomeView } from './home-view';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const empty: HomeSummary = {
  modules: [],
  upcoming: [],
  alertBuckets: { within7: 0, within30: 0, within90: 0 },
};
const full: HomeSummary = {
  modules: [
    { module: 'ppa', total: 10, active: 8, expiring: 2 },
    { module: 'gc', total: 5, active: 4, expiring: 1 },
    { module: 'legal', total: 7, active: 6, expiring: 1 },
  ],
  upcoming: [],
  alertBuckets: { within7: 0, within30: 0, within90: 0 },
};

function login(username: string) {
  const user = MOCK_USERS.find((u) => u.username === username)!;
  useAuthStore.setState({ user, status: 'authenticated' });
}

beforeEach(() => {
  vi.restoreAllMocks();
  replace.mockClear();
  vi.spyOn(homeService, 'summary').mockResolvedValue(structuredClone(full));
});

const cards = () => screen.findAllByRole('link', { name: lo.home.openModule });

describe('HomeView', () => {
  it('admin sees three module cards', async () => {
    login('admin');
    render(<HomeView />);
    expect(await cards()).toHaveLength(3);
    expect(replace).not.toHaveBeenCalled();
  });

  it('multi.user sees exactly two module cards (ppa, gc)', async () => {
    login('multi.user');
    render(<HomeView />);
    const links = await cards();
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/ppa', '/contracts']);
  });

  it('redirects ppa.user to /ppa without rendering cards', async () => {
    login('ppa.user');
    const { container } = render(<HomeView />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/ppa'));
    expect(screen.queryByRole('link', { name: lo.home.openModule })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects none.user to /forbidden', async () => {
    login('none.user');
    render(<HomeView />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/forbidden'));
    expect(screen.queryByRole('link', { name: lo.home.openModule })).toBeNull();
  });

  it('shows a retry banner when the summary request fails and retries', async () => {
    login('admin');
    const spy = vi.spyOn(homeService, 'summary').mockRejectedValueOnce(new Error('x'));
    spy.mockResolvedValue(structuredClone(empty));
    render(<HomeView />);
    const retry = await screen.findByRole('button', { name: lo.common.retry });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(retry);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
