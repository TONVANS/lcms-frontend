import {
  createListStore,
  createQueryCodec,
  useListUrlSync,
  DEFAULT_PAGE_SIZES,
  type ListQueryBase,
} from '@/lib/list';
import { supportService } from '../api/support.service';
import { TICKET_STATUSES, type SupportTicket, type TicketStatus } from '../types';

export const SUPPORT_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export interface SupportTicketsQuery extends ListQueryBase {
  page?: number;
  pageSize?: number;
  status?: TicketStatus;
}

export const supportTicketsQueryCodec = createQueryCodec<SupportTicketsQuery>({
  defaults: { page: 1, pageSize: 10 },
  enums: { status: TICKET_STATUSES },
  pageSizes: SUPPORT_PAGE_SIZES,
});

export const useSupportTicketsListStore = createListStore<SupportTicket, SupportTicketsQuery>(
  (q) =>
    supportService.tickets({
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 10,
      status: q.status,
    }),
  supportTicketsQueryCodec.defaults,
);

export function useSupportTicketsListUrlSync(): void {
  useListUrlSync(useSupportTicketsListStore, supportTicketsQueryCodec);
}
