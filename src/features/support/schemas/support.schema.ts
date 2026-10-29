import { z } from 'zod';
import { env } from '@/config/env';
import { lo } from '@/lib/i18n/lo';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../types';

export const TICKET_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp';
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

const trimmed = (msg: string) => z.string().trim().min(1, msg);

export const ticketFormSchema = z.object({
  subject: trimmed(lo.support.errors.subjectRequired).max(200),
  description: trimmed(lo.support.errors.descriptionRequired),
  priority: z.enum(TICKET_PRIORITIES, { message: lo.support.errors.priorityInvalid }),
  file: z
    .instanceof(File)
    .optional()
    .superRefine((f, ctx) => {
      if (!f) return;
      if (!IMAGE_EXT.test(f.name) || (f.type && !IMAGE_MIME.has(f.type))) {
        ctx.addIssue({ code: 'custom', message: lo.support.errors.fileType });
      } else if (f.size > env.NEXT_PUBLIC_MAX_UPLOAD_MB * 1024 * 1024) {
        ctx.addIssue({
          code: 'custom',
          message: lo.support.errors.fileSize(env.NEXT_PUBLIC_MAX_UPLOAD_MB),
        });
      }
    }),
});
export type TicketFormValues = z.input<typeof ticketFormSchema>;

export const ticketUpdateSchema = z.object({
  status: z.enum(TICKET_STATUSES, { message: lo.support.errors.statusInvalid }),
  adminNote: z.string().optional(),
});
export type TicketUpdateValues = z.input<typeof ticketUpdateSchema>;

export const contactFormSchema = z.object({
  channelName: trimmed(lo.support.errors.channelNameRequired).max(100),
  contactInfo: trimmed(lo.support.errors.contactInfoRequired).max(255),
  description: z.string().optional(),
});
export type ContactFormValues = z.input<typeof contactFormSchema>;
