import { describe, expect, it } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { contactFormSchema, ticketFormSchema, ticketUpdateSchema } from './support.schema';

describe('ticketFormSchema', () => {
  it('requires subject and description with Lao messages', () => {
    const r = ticketFormSchema.safeParse({ subject: ' ', description: '', priority: 'MEDIUM' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msgs = Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
      expect(msgs.subject).toBe(lo.support.errors.subjectRequired);
      expect(msgs.description).toBe(lo.support.errors.descriptionRequired);
    }
  });

  it('accepts valid input and an allowed image', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    expect(ticketFormSchema.safeParse({ subject: 'S', description: 'D', priority: 'HIGH', file }).success).toBe(true);
  });

  it('rejects a non-image file', () => {
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    const r = ticketFormSchema.safeParse({ subject: 'S', description: 'D', priority: 'LOW', file });
    expect(r.success).toBe(false);
  });

  it('rejects an oversize file', () => {
    const big = new File([new Uint8Array(26 * 1024 * 1024)], 'a.png', { type: 'image/png' });
    expect(ticketFormSchema.safeParse({ subject: 'S', description: 'D', priority: 'LOW', file: big }).success).toBe(false);
  });

  it('rejects an unknown priority', () => {
    expect(ticketFormSchema.safeParse({ subject: 'S', description: 'D', priority: 'NOPE' }).success).toBe(false);
  });
});

describe('contactFormSchema / ticketUpdateSchema', () => {
  it('requires name and info', () => {
    expect(contactFormSchema.safeParse({ channelName: '', contactInfo: '' }).success).toBe(false);
    expect(contactFormSchema.safeParse({ channelName: 'A', contactInfo: 'b' }).success).toBe(true);
  });
  it('requires a valid status', () => {
    expect(ticketUpdateSchema.safeParse({ status: 'X', adminNote: '' }).success).toBe(false);
    expect(ticketUpdateSchema.safeParse({ status: 'CLOSED', adminNote: '' }).success).toBe(true);
  });
});
