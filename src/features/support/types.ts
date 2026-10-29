export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface ContactChannel {
  id: string;
  channelName: string;
  contactInfo: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  adminNote: string | null;
  hasAttachment: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface CreateContactDto {
  channelName: string;
  contactInfo: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  priority: TicketPriority;
  file?: File;
}

export interface UpdateTicketInput {
  status: TicketStatus;
  adminNote?: string;
}

export interface TicketsQuery {
  page: number;
  pageSize: number;
  status?: TicketStatus;
}
