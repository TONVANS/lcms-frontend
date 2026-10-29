import { create } from 'zustand';
import { isCanceledError, normalizeError, toUserMessage } from '@/lib/api/errors';
import { registerLogoutReset } from '@/lib/auth/logout-registry';
import { hasSystemModule } from '@/lib/auth/permissions';
import type { User } from '@/types/domain';
import { notificationsService } from '../api/notifications.service';
import type { AppNotification, NotificationSource } from '../types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  status: Status;
  error: string | null;
  /** Sources of the user passed to the last `fetch`; `markAllRead` targets these. */
  sources: NotificationSource[];
  fetch(user: User): Promise<void>;
  markRead(n: AppNotification): Promise<void>;
  markAllRead(): Promise<void>;
  reset(): void;
}

/** Sources the user may read. */
export function sourcesFor(user: User): NotificationSource[] {
  const out: NotificationSource[] = [];
  if (hasSystemModule(user, 'contracts')) out.push('contracts');
  if (hasSystemModule(user, 'power-contracts') || hasSystemModule(user, 'power-notifications')) {
    out.push('power');
  }
  return out;
}

/** Detail route of the contract a notification refers to, or null without a contract id. */
export function contractHref(n: AppNotification): string | null {
  if (!n.contractId) return null;
  const id = encodeURIComponent(n.contractId);
  return n.source === 'power' ? `/ppa/contracts/${id}` : `/contracts/${id}`;
}

export const notificationKey = (n: Pick<AppNotification, 'source' | 'id'>): string =>
  `${n.source}:${n.id}`;

const time = (iso: string): number => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

const countUnread = (items: AppNotification[]): number => items.filter((i) => !i.read).length;

const initial = () => ({
  items: [] as AppNotification[],
  unreadCount: 0,
  status: 'idle' as Status,
  error: null as string | null,
  sources: [] as NotificationSource[],
});

// Bumped by reset(); work started in an earlier generation drops its result.
let generation = 0;
// Bumped by every fetch(); only the newest request may write.
let requestSeq = 0;
let controller: AbortController | null = null;

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  ...initial(),

  async fetch(user) {
    const gen = generation;
    const seq = ++requestSeq;
    controller?.abort();
    const ac = new AbortController();
    controller = ac;
    const sources = sourcesFor(user);
    set({ status: 'loading', error: null, sources });
    try {
      const lists = await Promise.all(
        sources.map((s) => notificationsService.list(s, { signal: ac.signal })),
      );
      if (gen !== generation || seq !== requestSeq) return;
      const items = lists.flat().sort((a, b) => time(b.createdAt) - time(a.createdAt));
      set({ items, unreadCount: countUnread(items), status: 'ready', error: null });
    } catch (e) {
      if (gen !== generation || seq !== requestSeq) return;
      if (isCanceledError(e) || normalizeError(e).code === 'ERR_CANCELED') return;
      set({ status: 'error', error: toUserMessage(normalizeError(e)) });
    }
  },

  async markRead(n) {
    const gen = generation;
    const key = notificationKey(n);
    const target = get().items.find((i) => notificationKey(i) === key);
    if (!target || target.read) return;
    const apply = (read: boolean) => {
      const items = get().items.map((i) => (notificationKey(i) === key ? { ...i, read } : i));
      set({ items, unreadCount: countUnread(items) });
    };
    apply(true);
    try {
      await notificationsService.markRead(n.source, n.id);
    } catch (e) {
      if (gen !== generation) return;
      apply(false);
      if (!isCanceledError(e)) set({ error: toUserMessage(normalizeError(e)) });
    }
  },

  async markAllRead() {
    const gen = generation;
    const sources = get().sources;
    const previous = get().items;
    const wasUnread = new Set(previous.filter((i) => !i.read).map(notificationKey));
    if (wasUnread.size === 0) return;
    const items = previous.map((i) => (i.read ? i : { ...i, read: true }));
    set({ items, unreadCount: 0 });
    const results = await Promise.allSettled(sources.map((s) => notificationsService.markAllRead(s)));
    if (gen !== generation) return;
    const failed = new Set<NotificationSource>();
    let firstError: unknown = null;
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        failed.add(sources[i]);
        firstError ??= r.reason;
      }
    });
    if (failed.size === 0) return;
    const rolled = get().items.map((i) =>
      failed.has(i.source) && wasUnread.has(notificationKey(i)) ? { ...i, read: false } : i,
    );
    set({
      items: rolled,
      unreadCount: countUnread(rolled),
      error: toUserMessage(normalizeError(firstError)),
    });
  },

  reset() {
    generation += 1;
    controller?.abort();
    controller = null;
    set(initial());
  },
}));

registerLogoutReset(() => useNotificationsStore.getState().reset());
