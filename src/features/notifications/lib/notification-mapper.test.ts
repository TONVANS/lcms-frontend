import { describe, expect, it } from 'vitest';
import { toNotification } from './notification-mapper';

describe('toNotification', () => {
  it('maps a contracts notification with nested contract', () => {
    const n = toNotification(
      {
        id: 12,
        title: 'Expiring',
        message: 'Soon',
        contract: { id: 'c1', contractNumber: 'GC-1', expirationDate: '2026-12-01T00:00:00.000Z' },
        daysRemaining: '15',
        isRead: false,
        createdAt: '2026-10-01T08:00:00.000Z',
      },
      'contracts',
    );
    expect(n).toEqual({
      id: '12',
      source: 'contracts',
      title: 'Expiring',
      message: 'Soon',
      contractId: 'c1',
      contractLabel: 'GC-1',
      daysLeft: 15,
      expirationDate: '2026-12-01',
      read: false,
      createdAt: '2026-10-01T08:00:00.000Z',
    });
  });

  it('maps a power notification with alternate field names', () => {
    const n = toNotification(
      {
        id: 'p9',
        subject: 'Subj',
        body: 'Body',
        powerContractId: 'pc1',
        powerContract: { contractNumber: 'PPA-1', projectName: 'Dam', expirationDate: '2027-01-02' },
        daysBeforeExpiry: 30,
        readAt: '2026-10-02T00:00:00Z',
        createdAt: '2026-10-01T00:00:00Z',
      },
      'power',
    );
    expect(n).toMatchObject({
      id: 'p9',
      title: 'Subj',
      message: 'Body',
      contractId: 'pc1',
      contractLabel: 'PPA-1',
      daysLeft: 30,
      expirationDate: '2027-01-02',
      read: true,
    });
  });

  it('is tolerant of junk', () => {
    const n = toNotification(null, 'contracts');
    expect(n).toMatchObject({
      source: 'contracts',
      message: null,
      contractId: null,
      contractLabel: null,
      daysLeft: null,
      expirationDate: null,
      read: false,
    });
    expect(typeof n.title).toBe('string');
  });

  it('derives a title from type and prefers contractId over nested', () => {
    const n = toNotification({ id: 1, type: 'EXPIRY_30', contractId: 'x', contract: { id: 'y' } }, 'contracts');
    expect(n.title).toBe('EXPIRY_30');
    expect(n.contractId).toBe('x');
    expect(n.read).toBe(false);
  });

  it('reads isRead=true and read=true', () => {
    expect(toNotification({ id: 1, isRead: true }, 'power').read).toBe(true);
    expect(toNotification({ id: 1, read: true }, 'power').read).toBe(true);
  });
});
