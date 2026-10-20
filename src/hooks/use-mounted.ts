import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true only after mounting on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
