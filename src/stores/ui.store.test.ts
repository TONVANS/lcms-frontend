import { beforeEach, describe, expect, it } from 'vitest';
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

  it('updates density and collapsed state', () => {
    useUiStore.getState().setTableDensity('compact');
    useUiStore.getState().setSidebarCollapsed(true);
    expect(useUiStore.getState().tableDensity).toBe('compact');
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });
});
