import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { historyService } from '../api/history.service';
import { HistoryTimeline } from './history-timeline';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  setMockSession('admin', false);
});
afterEach(() => {
  vi.restoreAllMocks();
  clearMockSession();
});

describe('HistoryTimeline', () => {
  it('renders entries with Lao action labels, user and change lines', async () => {
    render(<HistoryTimeline kind="contracts" id="gc-001" pageSize={2} />);
    expect(await screen.findAllByText(lo.history.actions.UPDATE_CONTRACT)).not.toHaveLength(0);
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/→/).length).toBeGreaterThan(0);
  });

  it('loads more pages until the total is reached', async () => {
    const user = userEvent.setup();
    render(<HistoryTimeline kind="contracts" id="gc-001" pageSize={2} />);
    await screen.findAllByText(lo.history.actions.UPDATE_CONTRACT);
    const before = screen.getAllByRole('listitem').length;
    await user.click(screen.getByRole('button', { name: lo.history.loadMore }));
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(before));
    // 5 mock entries, 2 per page: pages 1..3 exhaust it.
    await user.click(screen.getByRole('button', { name: lo.history.loadMore }));
    await waitFor(() => expect(screen.queryByRole('button', { name: lo.history.loadMore })).toBeNull());
  });

  it('shows the empty state', async () => {
    vi.spyOn(historyService, 'list').mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
    render(<HistoryTimeline kind="power-contracts" id="ppa-1" />);
    expect(await screen.findByText(lo.history.empty)).toBeInTheDocument();
  });

  it('shows an error banner with retry', async () => {
    const spy = vi.spyOn(historyService, 'list').mockRejectedValueOnce({ status: 0, code: 'NETWORK', message: '' });
    const user = userEvent.setup();
    render(<HistoryTimeline kind="contracts" id="gc-001" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.history.loadError);
    await user.click(screen.getByRole('button', { name: lo.common.retry }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText(lo.history.actions.UPDATE_CONTRACT)).not.toHaveLength(0);
  });

  it('falls back to the raw action for unknown actions', async () => {
    vi.spyOn(historyService, 'list').mockResolvedValue({
      items: [{ id: 'z', action: 'SOMETHING_NEW', createdAt: '2026-01-01', userName: null, changes: [] }],
      page: 1,
      pageSize: 10,
      total: 1,
    });
    render(<HistoryTimeline kind="contracts" id="gc-001" />);
    expect(await screen.findByText('SOMETHING_NEW')).toBeInTheDocument();
  });
});
