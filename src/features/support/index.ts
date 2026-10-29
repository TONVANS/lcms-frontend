export { supportService } from './api/support.service';
export { SupportView } from './components/support-view';
export { useSupportContacts } from './hooks/use-support-contacts';
export { contactKind, toContactChannel, toSupportTicket } from './lib/support-mapper';
export type { ContactKind } from './lib/support-mapper';
export type {
  ContactChannel,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from './types';
