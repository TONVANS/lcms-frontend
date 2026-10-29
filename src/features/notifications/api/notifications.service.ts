import { api } from '@/lib/api/client';
import { unwrapPage } from '@/lib/api/envelope';
import { endpoints } from '@/lib/api/endpoints';
import { toNotification } from '../lib/notification-mapper';
import type { AppNotification, NotificationSource } from '../types';

const EP = {
  contracts: endpoints.notifications,
  power: endpoints.powerNotifications,
} as const;

export interface ListNotificationsOptions {
  unreadOnly?: boolean;
  signal?: AbortSignal;
}

export const notificationsService = {
  /** The backend defaults to unread-only, so `unreadOnly` is always sent explicitly. */
  async list(
    source: NotificationSource,
    opts: ListNotificationsOptions = {},
  ): Promise<AppNotification[]> {
    const { data } = await api.get<unknown>(EP[source].list, {
      params: { unreadOnly: opts.unreadOnly ?? false },
      signal: opts.signal,
    });
    return unwrapPage(data, { page: 1, pageSize: Number.MAX_SAFE_INTEGER }, (raw) =>
      toNotification(raw, source),
    ).items;
  },
  async markRead(source: NotificationSource, id: string): Promise<void> {
    await api.patch(EP[source].read(id));
  },
  async markAllRead(source: NotificationSource): Promise<void> {
    await api.patch(EP[source].readAll);
  },
};
