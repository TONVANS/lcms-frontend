import { describe, expect, it } from 'vitest';
import { contactKind, toContactChannel, toSupportTicket } from './support-mapper';

describe('toContactChannel', () => {
  it('maps a full backend row', () => {
    expect(
      toContactChannel({
        id: 3,
        channelName: 'IT Support',
        contactInfo: '+856 20 123',
        description: 'Mon-Fri',
        sortOrder: '2',
        isActive: true,
      }),
    ).toEqual({
      id: '3',
      channelName: 'IT Support',
      contactInfo: '+856 20 123',
      description: 'Mon-Fri',
      sortOrder: 2,
      isActive: true,
    });
  });

  it('is tolerant of garbage', () => {
    expect(toContactChannel(null)).toEqual({
      id: '',
      channelName: '',
      contactInfo: '',
      description: null,
      sortOrder: 0,
      isActive: true,
    });
    expect(toContactChannel({ isActive: false }).isActive).toBe(false);
  });
});

describe('contactKind', () => {
  it('detects email, phone and plain text', () => {
    expect(contactKind('a@b.la')).toBe('email');
    expect(contactKind('+856 21 000 000')).toBe('phone');
    expect(contactKind('020-5555-1234')).toBe('phone');
    expect(contactKind('Facebook: LCMS')).toBe('text');
  });
});

describe('toSupportTicket', () => {
  it('maps a backend ticket with nested creator and attachment url', () => {
    const t = toSupportTicket({
      id: 'abc',
      subject: 'Bug',
      description: 'It broke',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      adminNote: 'looking',
      attachmentUrl: '/uploads/x.png',
      createdAt: '2026-10-01T03:00:00.000Z',
      updatedAt: '2026-10-02T03:00:00.000Z',
      createdBy: { id: 'u-2', fullName: 'Somchai' },
    });
    expect(t).toEqual({
      id: 'abc',
      subject: 'Bug',
      description: 'It broke',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      adminNote: 'looking',
      hasAttachment: true,
      createdAt: '2026-10-01T03:00:00.000Z',
      updatedAt: '2026-10-02T03:00:00.000Z',
      createdBy: 'Somchai',
    });
  });

  it('defaults unknown enums and missing fields', () => {
    const t = toSupportTicket({ id: 1, priority: 'weird', status: 'nope' });
    expect(t).toMatchObject({
      id: '1',
      subject: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      adminNote: null,
      hasAttachment: false,
      createdBy: null,
    });
  });

  it('lower-case enums are normalised and hasAttachment flag is honoured', () => {
    const t = toSupportTicket({ id: 1, priority: 'urgent', status: 'resolved', hasAttachment: true });
    expect(t.priority).toBe('URGENT');
    expect(t.status).toBe('RESOLVED');
    expect(t.hasAttachment).toBe(true);
  });

  it('accepts a string creator', () => {
    expect(toSupportTicket({ id: 1, createdBy: 'bob' }).createdBy).toBe('bob');
    expect(toSupportTicket({ id: 1, user: { username: 'amy' } }).createdBy).toBe('amy');
  });
});
