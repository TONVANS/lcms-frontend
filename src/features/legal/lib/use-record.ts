'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeError } from '@/lib/api/errors';
import type { ApiError } from '@/types/api';

export type RecordState<T> =
  | { kind: 'loading' }
  | { kind: 'ready'; record: T }
  | { kind: 'notFound' }
  | { kind: 'error'; error: ApiError };

/** Loads one record by id; 404 becomes `notFound`. Mount it keyed by id to reset between records. */
export function useRecord<T>(
  id: string,
  fetcher: (id: string) => Promise<T>,
): { state: RecordState<T>; retry: () => void; setRecord: (r: T) => void } {
  const [state, setState] = useState<RecordState<T>>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher(id)
      .then((record) => {
        if (active) setState({ kind: 'ready', record });
      })
      .catch((e: unknown) => {
        if (!active) return;
        const error = normalizeError(e);
        setState(error.status === 404 ? { kind: 'notFound' } : { kind: 'error', error });
      });
    return () => {
      active = false;
    };
    // The fetcher is a stable service method.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadKey]);

  const retry = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadKey((k) => k + 1);
  }, []);
  const setRecord = useCallback((record: T) => setState({ kind: 'ready', record }), []);
  return { state, retry, setRecord };
}
