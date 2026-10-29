'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { supportService } from '../api/support.service';
import type { ContactChannel } from '../types';

export type LoadStatus = 'loading' | 'ready' | 'error';

/** Fetches contact channels while `enabled`; `reload()` refetches. */
export function useSupportContacts(enabled = true) {
  const [contacts, setContacts] = useState<ContactChannel[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const gen = useRef(0);

  const load = useCallback(async () => {
    const mine = ++gen.current;
    setStatus('loading');
    try {
      const rows = await supportService.contacts();
      if (mine !== gen.current) return;
      setContacts(rows.filter((c) => c.isActive));
      setError(null);
      setStatus('ready');
    } catch (e) {
      if (mine !== gen.current) return;
      setError(toUserMessage(normalizeError(e)) || null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
    const cancel = () => {
      gen.current++;
    };
    return cancel;
  }, [enabled, load]);

  return { contacts, status, error, reload: load };
}
