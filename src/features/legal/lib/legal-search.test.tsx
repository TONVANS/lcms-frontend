import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LegalSearch } from './legal-search';

describe('LegalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces input changes before calling onChange', () => {
    const onChange = vi.fn();
    render(
      <LegalSearch
        value=""
        onChange={onChange}
        placeholder="Search..."
        ariaLabel="Search box"
      />,
    );

    const input = screen.getByLabelText('Search box');
    fireEvent.change(input, { target: { value: 'test query' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('test query');
  });

  it('syncs external value change when not editing', () => {
    const { rerender } = render(
      <LegalSearch
        value="first"
        onChange={vi.fn()}
        placeholder="Search..."
        ariaLabel="Search box"
      />,
    );

    expect(screen.getByLabelText('Search box')).toHaveValue('first');

    rerender(
      <LegalSearch
        value="updated"
        onChange={vi.fn()}
        placeholder="Search..."
        ariaLabel="Search box"
      />,
    );

    expect(screen.getByLabelText('Search box')).toHaveValue('updated');
  });
});
