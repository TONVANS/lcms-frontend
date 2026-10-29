import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { powerMockDb } from '../mocks/ppa.mock';
import { DEFAULT_POWER_QUERY, parsePowerListQuery, serializePowerListQuery } from './ppa-list-query';
import { usePpaListStore } from './ppa-list.store';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  setMockSession('ppa.user', false);
  powerMockDb.reset();
  usePpaListStore.getState().reset();
});

describe('usePpaListStore', () => {
  it('fetches contracts into state', async () => {
    expect(usePpaListStore.getState().status).toBe('idle');
    await usePpaListStore.getState().fetch();
    const s = usePpaListStore.getState();
    expect(s.status).toBe('ready');
    expect(s.items).toHaveLength(10);
    expect(s.total).toBeGreaterThanOrEqual(25);
  });

  it('patching the query resets the page unless the page is patched', () => {
    usePpaListStore.getState().setQuery({ page: 3 });
    expect(usePpaListStore.getState().query.page).toBe(3);
    usePpaListStore.getState().setQuery({ status: 'ACTIVE' });
    expect(usePpaListStore.getState().query).toMatchObject({ status: 'ACTIVE', page: 1 });
  });

  it('applies filters on fetch', async () => {
    usePpaListStore.getState().setQuery({ contractType: 'SALE', status: 'ACTIVE' });
    await usePpaListStore.getState().fetch();
    const { items } = usePpaListStore.getState();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((c) => c.contractType === 'SALE' && c.status === 'ACTIVE')).toBe(true);
  });

  it('afterDelete steps back a page when the last page empties', async () => {
    usePpaListStore.getState().setQuery({ pageSize: 10 });
    const total = powerMockDb.all().length;
    const lastPage = Math.ceil(total / 10);
    // leave exactly one record on the last page, then delete it
    const onLast = total - (lastPage - 1) * 10;
    for (let i = 0; i < onLast - 1; i++) powerMockDb.remove(powerMockDb.all()[total - 1 - i].id as string);
    usePpaListStore.getState().setQuery({ page: lastPage });
    await usePpaListStore.getState().fetch();
    expect(usePpaListStore.getState().items).toHaveLength(1);
    powerMockDb.remove(usePpaListStore.getState().items[0].id);
    await usePpaListStore.getState().afterDelete();
    expect(usePpaListStore.getState().query.page).toBe(lastPage - 1);
    expect(usePpaListStore.getState().items.length).toBeGreaterThan(0);
  });

  it('clears state on reset', async () => {
    await usePpaListStore.getState().fetch();
    usePpaListStore.getState().reset();
    expect(usePpaListStore.getState().items).toHaveLength(0);
    expect(usePpaListStore.getState().status).toBe('idle');
    expect(usePpaListStore.getState().query).toEqual(DEFAULT_POWER_QUERY);
  });
});

describe('power list query url codec', () => {
  it('round-trips filters and drops defaults', () => {
    const q = parsePowerListQuery(
      new URLSearchParams('q=abc&type=SALE&status=EXPIRED&project=Acme&page=3&pageSize=20'),
    );
    expect(q).toEqual({
      q: 'abc',
      contractType: 'SALE',
      status: 'EXPIRED',
      projectTypeOrCustomer: 'Acme',
      page: 3,
      pageSize: 20,
    });
    expect(new URLSearchParams(serializePowerListQuery(q)).get('project')).toBe('Acme');
    expect(serializePowerListQuery(DEFAULT_POWER_QUERY)).toBe('');
  });

  it('ignores invalid values', () => {
    const q = parsePowerListQuery(new URLSearchParams('type=X&status=active&page=-1&pageSize=7'));
    expect(q).toEqual(DEFAULT_POWER_QUERY);
  });
});
