import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { usePpaListStore } from './ppa-list.store';

describe('usePpaListStore', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
    usePpaListStore.getState().reset();
  });

  it('fetches contracts into state', async () => {
    expect(usePpaListStore.getState().status).toBe('idle');
    await usePpaListStore.getState().fetch();

    const state = usePpaListStore.getState();
    expect(state.status).toBe('ready');
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.total).toBeGreaterThan(0);
  });

  it('updates filters and resets page to 1', () => {
    usePpaListStore.getState().setFilter('page', 3);
    expect(usePpaListStore.getState().filters.page).toBe(3);

    usePpaListStore.getState().setFilter('status', 'active');
    expect(usePpaListStore.getState().filters.status).toBe('active');
    expect(usePpaListStore.getState().filters.page).toBe(1);
  });

  it('clears state on reset', async () => {
    await usePpaListStore.getState().fetch();
    expect(usePpaListStore.getState().items.length).toBeGreaterThan(0);

    usePpaListStore.getState().reset();
    expect(usePpaListStore.getState().items).toHaveLength(0);
    expect(usePpaListStore.getState().status).toBe('idle');
  });
});
