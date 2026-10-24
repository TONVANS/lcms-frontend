import { beforeEach, describe, expect, it } from 'vitest';
import { useRegulationsListStore } from '@/features/legal/regulations/store/regulations-list.store';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { casesMockDb } from '../mocks/cases.mock';
import { useCasesListStore } from '../store/cases-list.store';
import { casesService } from './cases.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  casesMockDb.reset(new Date());
  setMockSession('legal.viewer', false);
});

describe('casesService', () => {
  it('list passes query params and returns Paginated', async () => {
    const r = await casesService.list({
      caseType: 'criminal',
      sort: 'caseNo',
      order: 'asc',
      page: 1,
      pageSize: 25,
    });
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
    expect(r.total).toBe(r.items.length);
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items.every((x) => x.caseType === 'criminal')).toBe(true);
  });
});

describe('useCasesListStore', () => {
  it('is a createListStore instance with independent state from useRegulationsListStore', () => {
    useCasesListStore.getState().setQuery({ q: 'litigation-test' });
    expect(useCasesListStore.getState().query.q).toBe('litigation-test');
    expect(useRegulationsListStore.getState().query.q).toBeUndefined();

    useRegulationsListStore.getState().setQuery({ q: 'reg-test' });
    expect(useRegulationsListStore.getState().query.q).toBe('reg-test');
    expect(useCasesListStore.getState().query.q).toBe('litigation-test');
  });
});
