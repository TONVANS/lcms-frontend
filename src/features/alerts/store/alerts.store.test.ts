import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import type { Alert } from '@/types/domain';
import { alertsService } from '../api/alerts.service';
import { useAlertsStore } from './alerts.store';

beforeEach(() => {
  vi.restoreAllMocks();
  clearMockSession();
  useAlertsStore.getState().reset();
});

const mk = (id: string, module: Alert['module'], read: boolean): Alert => ({
  id,
  module,
  entityType: 'contract',
  entityId: id,
  title: id,
  dueDate: '2026-10-21',
  daysLeft: 1,
  read,
});

describe('alerts store', () => {
  it('computes unreadCount from fetched items', async () => {
    vi.spyOn(alertsService, 'list').mockResolvedValue([
      mk('1', 'ppa', false),
      mk('2', 'gc', true),
      mk('3', 'gc', false),
    ]);
    await useAlertsStore.getState().fetch();
    const s = useAlertsStore.getState();
    expect(s.status).toBe('ready');
    expect(s.items).toHaveLength(3);
    expect(s.unreadCount).toBe(2);
  });

  it('sets error status on failure and reset clears state', async () => {
    vi.spyOn(alertsService, 'list').mockRejectedValue(new Error('boom'));
    await useAlertsStore.getState().fetch();
    expect(useAlertsStore.getState().status).toBe('error');
    useAlertsStore.getState().reset();
    expect(useAlertsStore.getState()).toMatchObject({ items: [], unreadCount: 0, status: 'idle' });
  });

  it('loads only the session user module alerts via the mock API', async () => {
    setMockSession('ppa.user', false);
    await useAlertsStore.getState().fetch();
    const { items } = useAlertsStore.getState();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((a) => a.module === 'ppa')).toBe(true);
  });
});
