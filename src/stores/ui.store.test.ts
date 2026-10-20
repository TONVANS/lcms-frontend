import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from './ui.store';

describe('useUiStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useUiStore.setState({ sidebarCollapsed: false, lastModule: null, tableDensity: 'comfortable' });
  });

  it('persists lastModule under lcms-ui', () => {
    useUiStore.getState().setLastModule('gc');
    expect(JSON.parse(localStorage.getItem('lcms-ui')!).state.lastModule).toBe('gc');
  });

  it('does not rehydrate at module import', async () => {
    localStorage.setItem('lcms-ui', JSON.stringify({ state: { lastModule: 'gc' }, version: 0 }));
    vi.resetModules();
    const { useUiStore: fresh } = await import('./ui.store');
    expect(fresh.getState().lastModule).toBeNull();
  });

  it('updates density and collapsed state', () => {
    useUiStore.getState().setTableDensity('compact');
    useUiStore.getState().setSidebarCollapsed(true);
    expect(useUiStore.getState().tableDensity).toBe('compact');
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });
});
