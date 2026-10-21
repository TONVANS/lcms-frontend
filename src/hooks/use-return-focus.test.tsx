import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReturnFocus } from './use-return-focus';

describe('useReturnFocus', () => {
  it('refocuses the element that was focused when open became true', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    const { result, rerender } = renderHook(({ open }) => useReturnFocus(open), {
      initialProps: { open: false },
    });
    rerender({ open: true });
    (document.activeElement as HTMLElement).blur();
    const e = new Event('focus', { cancelable: true });
    result.current(e);
    expect(e.defaultPrevented).toBe(true);
    expect(btn).toHaveFocus();
    btn.remove();
  });

  it('does not throw when the opener was removed', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    const { result, rerender } = renderHook(({ open }) => useReturnFocus(open), {
      initialProps: { open: false },
    });
    rerender({ open: true });
    btn.remove();
    const e = new Event('focus', { cancelable: true });
    expect(() => result.current(e)).not.toThrow();
    expect(e.defaultPrevented).toBe(true);
  });
});
