import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { unwrap, unwrapPage } from '@/lib/api/envelope';
import type { Paginated } from '@/types/api';
import { toContactChannel, toSupportTicket } from '../lib/support-mapper';
import type {
  ContactChannel,
  CreateContactDto,
  CreateTicketInput,
  SupportTicket,
  TicketsQuery,
  UpdateTicketInput,
} from '../types';

export const supportService = {
  contacts: (): Promise<ContactChannel[]> =>
    api
      .get(endpoints.support.contacts)
      .then((r) =>
        unwrapPage(r.data, { page: 1, pageSize: 1000 }, toContactChannel).items.sort(
          (a, b) => a.sortOrder - b.sortOrder,
        ),
      ),

  createContact: (dto: CreateContactDto): Promise<ContactChannel> =>
    api.post(endpoints.support.contacts, dto).then((r) => toContactChannel(unwrap<unknown>(r.data))),

  deleteContact: (id: string): Promise<void> =>
    api.delete(endpoints.support.contact(id)).then(() => undefined),

  tickets: (q: TicketsQuery): Promise<Paginated<SupportTicket>> => {
    const params: Record<string, unknown> = { page: q.page, limit: q.pageSize };
    if (q.status) params.status = q.status;
    return api
      .get(endpoints.support.tickets, { params })
      .then((r) => unwrapPage(r.data, { page: q.page, pageSize: q.pageSize }, toSupportTicket));
  },

  ticket: (id: string): Promise<SupportTicket> =>
    api.get(endpoints.support.ticket(id)).then((r) => toSupportTicket(unwrap<unknown>(r.data))),

  /** Multipart when an image is attached, JSON otherwise. */
  createTicket: (input: CreateTicketInput): Promise<SupportTicket> => {
    const { file, ...fields } = input;
    if (file) {
      const form = new FormData();
      form.append('subject', fields.subject);
      form.append('description', fields.description);
      form.append('priority', fields.priority);
      form.append('file', file);
      return api
        .post(endpoints.support.tickets, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((r) => toSupportTicket(unwrap<unknown>(r.data)));
    }
    return api
      .post(endpoints.support.tickets, fields)
      .then((r) => toSupportTicket(unwrap<unknown>(r.data)));
  },

  updateTicket: (id: string, input: UpdateTicketInput): Promise<SupportTicket> =>
    api
      .patch(endpoints.support.ticket(id), input)
      .then((r) => toSupportTicket(unwrap<unknown>(r.data))),

  /** Fetched through `api` so the Bearer header is sent. */
  ticketAttachment: (id: string): Promise<Blob> =>
    api
      .get<Blob>(endpoints.support.ticketAttachment(id), { responseType: 'blob' })
      .then((r) => r.data),
};
