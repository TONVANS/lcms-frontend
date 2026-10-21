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

  it('keeps the newest fetch when an older one resolves last', async () => {
    let resolveFirst!: (v: Alert[]) => void;
    let resolveSecond!: (v: Alert[]) => void;
    vi.spyOn(alertsService, 'list')
      .mockReturnValueOnce(new Promise<Alert[]>((r) => (resolveFirst = r)))
      .mockReturnValueOnce(new Promise<Alert[]>((r) => (resolveSecond = r)));
    const first = useAlertsStore.getState().fetch();
    const second = useAlertsStore.getState().fetch();
    resolveSecond([mk('new', 'gc', false)]);
    await second;
    resolveFirst([mk('old1', 'ppa', false), mk('old2', 'ppa', false)]);
    await first;
    const s = useAlertsStore.getState();
    expect(s.items.map((a) => a.id)).toEqual(['new']);
    expect(s.unreadCount).toBe(1);
    expect(s.status).toBe('ready');
  });

  it('drops a fetch result that resolves after reset', async () => {
    let resolve!: (v: Alert[]) => void;
    vi.spyOn(alertsService, 'list').mockReturnValue(new Promise<Alert[]>((r) => (resolve = r)));
    const p = useAlertsStore.getState().fetch();
    useAlertsStore.getState().reset();
    resolve([mk('1', 'ppa', false)]);
    await p;
    expect(useAlertsStore.getState()).toMatchObject({ items: [], unreadCount: 0, status: 'idle' });
  });

  it('drops a fetch error that arrives after reset', async () => {
    let reject!: (e: Error) => void;
    vi.spyOn(alertsService, 'list').mockReturnValue(new Promise<Alert[]>((_, r) => (reject = r)));
    const p = useAlertsStore.getState().fetch();
    useAlertsStore.getState().reset();
    reject(new Error('late'));
    await p;
    expect(useAlertsStore.getState().status).toBe('idle');
  });

  it('loads only the session user module alerts via the mock API', async () => {
    setMockSession('ppa.user', false);
    await useAlertsStore.getState().fetch();
    const { items } = useAlertsStore.getState();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((a) => a.module === 'ppa')).toBe(true);
  });
});
