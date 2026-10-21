import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Controlled dialogs have no DialogTrigger, so Radix has nothing to return focus to and focus
 * falls to <body>. Remember the element focused when `open` turns true and hand it back on close.
 * Use the returned handler as `onCloseAutoFocus`. A detached element is skipped silently.
 */
export function useReturnFocus(open: boolean): (e: Event) => void {
  const target = useRef<HTMLElement | null>(null);

  // Layout effects run before Radix's passive focus-scope effect moves focus into the dialog.
  useLayoutEffect(() => {
    if (open) {
      const el = document.activeElement;
      target.current = el instanceof HTMLElement && el !== document.body ? el : null;
    }
  }, [open]);

  return useCallback((e: Event) => {
    e.preventDefault();
    const el = target.current;
    target.current = null;
    if (el?.isConnected) el.focus();
  }, []);
}
