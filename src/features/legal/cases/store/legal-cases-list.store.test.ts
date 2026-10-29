import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { legalCasesMockDb } from '../mocks/legal-cases.mock';
import { legalCasesQueryCodec as codec, useLegalCasesListStore as store } from './legal-cases-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  legalCasesMockDb.reset(new Date());
  store.getState().reset();
});

describe('legal cases list store', () => {
  it('codec carries filters and the date range through the URL', () => {
    const q = codec.parse(
      new URLSearchParams('caseType=CIVIL&disputeStatus=APPEAL&departmentId=d-1&startDate=2026-01-01&endDate=bad&sort=x'),
    );
    expect(q).toEqual({
      page: 1,
      pageSize: 10,
      caseType: 'CIVIL',
      disputeStatus: 'APPEAL',
      departmentId: 'd-1',
      startDate: '2026-01-01',
    });
    expect(parseRoundTrip(q)).toEqual(q);
  });

  it('fetches a filtered page through the service', async () => {
    setMockSession('legal.user', false);
    store.getState().setQuery({ disputeStatus: 'APPEAL' });
    await store.getState().fetch();
    const s = store.getState();
    expect(s.status).toBe('ready');
    expect(s.items.length).toBeGreaterThan(0);
    expect(s.items.every((c) => c.disputeStatus === 'APPEAL')).toBe(true);
  });
});

function parseRoundTrip(q: Parameters<typeof codec.serialize>[0]) {
  return codec.parse(new URLSearchParams(codec.serialize(q)));
}
