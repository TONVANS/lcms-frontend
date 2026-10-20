import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUiStore } from '@/stores/ui.store';
import { UiStoreHydrator } from './providers';

describe('UiStoreHydrator', () => {
  it('rehydrates the ui store from localStorage after mount', async () => {
    useUiStore.setState({ lastModule: null }); // persist writes through, so seed storage afterwards
    localStorage.setItem('lcms-ui', JSON.stringify({ state: { lastModule: 'gc' }, version: 0 }));
    render(<UiStoreHydrator />);
    await waitFor(() => expect(useUiStore.getState().lastModule).toBe('gc'));
  });
});
