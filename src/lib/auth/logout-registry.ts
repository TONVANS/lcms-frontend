type ResetFn = () => void;

const registry = new Set<ResetFn>();

/**
 * Registers a store or feature reset function that will be called
 * when the user logs out or the session expires.
 * Returns an unsubscribe function.
 */
export function registerLogoutReset(fn: ResetFn): () => void {
  registry.add(fn);
  return () => {
    registry.delete(fn);
  };
}

/**
 * Executes all registered logout reset callbacks.
 */
export function runLogoutResets(): void {
  for (const fn of registry) {
    try {
      fn();
    } catch (err) {
      console.error('Failed to reset store on logout:', err);
    }
  }
}

/**
 * Clears the registry. Intended for testing.
 */
export function clearLogoutRegistry(): void {
  registry.clear();
}
