import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import { lookupsService } from '../api/lookups.service';
import { useLookupsStore } from './lookups.store';

const dep = { id: 'd1', name: 'A', code: null };

beforeEach(() => useLookupsStore.getState().reset());
afterEach(() => vi.restoreAllMocks());

describe('lookups store', () => {
  it('loads once and caches', async () => {
    const spy = vi.spyOn(lookupsService, 'departments').mockResolvedValue([dep]);
    await useLookupsStore.getState().load('departments');
    await useLookupsStore.getState().load('departments');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(useLookupsStore.getState().departments).toMatchObject({ status: 'ready', items: [dep] });
  });

  it('dedupes in-flight requests', async () => {
    let resolve!: (v: (typeof dep)[]) => void;
    const spy = vi
      .spyOn(lookupsService, 'departments')
      .mockReturnValue(new Promise((r) => (resolve = r)));
    const a = useLookupsStore.getState().load('departments');
    const b = useLookupsStore.getState().load('departments');
    expect(useLookupsStore.getState().departments.status).toBe('loading');
    resolve([dep]);
    await Promise.all([a, b]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('keeps keys independent and records errors, then retries on demand', async () => {
    vi.spyOn(lookupsService, 'projectTypes').mockRejectedValueOnce({ status: 0, code: 'NETWORK', message: '' });
    await useLookupsStore.getState().load('projectTypes');
    expect(useLookupsStore.getState().projectTypes.status).toBe('error');
    expect(useLookupsStore.getState().projectTypes.error).toBeTruthy();
    expect(useLookupsStore.getState().departments.status).toBe('idle');
    vi.spyOn(lookupsService, 'projectTypes').mockResolvedValue(['x']);
    await useLookupsStore.getState().load('projectTypes', true);
    expect(useLookupsStore.getState().projectTypes).toMatchObject({ status: 'ready', items: ['x'], error: null });
  });

  it('logout reset clears the cache and drops in-flight results', async () => {
    let resolve!: (v: (typeof dep)[]) => void;
    vi.spyOn(lookupsService, 'departments').mockReturnValue(new Promise((r) => (resolve = r)));
    const p = useLookupsStore.getState().load('departments');
    runLogoutResets();
    resolve([dep]);
    await p;
    expect(useLookupsStore.getState().departments).toMatchObject({ status: 'idle', items: [] });
  });
});
