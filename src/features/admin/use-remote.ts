'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';

interface Result<T> {
  source: () => Promise<T>;
  data?: T;
  error?: string;
}

export interface Remote<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  reload: () => void;
}

/** Message to show for a failed admin call: the server's own text on 400/409/422, else the generic Lao text. */
export function adminErrorMessage(e: unknown): string {
  const err = normalizeError(e);
  if ((err.status === 400 || err.status === 409 || err.status === 422) && err.message) return err.message;
  return toUserMessage(err) || lo.errors.unknown;
}

/**
 * Runs `load` whenever its identity changes (wrap it in `useCallback` keyed by the filters).
 * `isLoading` is derived, so a filter change shows the skeleton without a setState in the effect body.
 */
export function useRemote<T>(load: () => Promise<T>): Remote<T> {
  const [res, setRes] = useState<Result<T> | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setRes({ source: load, data });
      })
      .catch((e: unknown) => {
        if (active) setRes({ source: load, error: adminErrorMessage(e) });
      });
    return () => {
      active = false;
    };
  }, [load, tick]);

  const reload = useCallback(() => {
    setRes(null);
    setTick((t) => t + 1);
  }, []);

  const current = res && res.source === load ? res : null;
  return {
    data: current?.data,
    error: current?.error ?? null,
    isLoading: current === null,
    reload,
  };
}
