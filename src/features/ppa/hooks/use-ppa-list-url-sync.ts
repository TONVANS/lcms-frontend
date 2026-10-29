'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { parsePowerListQuery, serializePowerListQuery } from '../store/ppa-list-query';
import { usePpaListStore } from '../store/ppa-list.store';

/**
 * Keeps the power list store and the URL in sync. The consumer must render this under a Suspense
 * boundary (useSearchParams under cacheComponents).
 */
export function usePpaListUrlSync(): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = usePpaListStore((s) => s.query);

  // Canonical string last applied in either direction; the effects below skip when equal.
  const syncedRef = useRef<string | null>(null);
  // Our own pushes in order; an echo drops itself and every earlier entry.
  const pendingRef = useRef<string[]>([]);
  const currentUrlRef = useRef<string>('');

  const urlKey = serializePowerListQuery(parsePowerListQuery(new URLSearchParams(searchParams)));

  useEffect(() => {
    currentUrlRef.current = urlKey;
  }, [urlKey]);

  // URL -> store: mount parse and browser back/forward.
  useEffect(() => {
    const first = syncedRef.current === null;
    if (!first) {
      const i = pendingRef.current.indexOf(urlKey);
      if (i !== -1) {
        pendingRef.current = pendingRef.current.slice(i + 1);
        return;
      }
      if (urlKey === serializePowerListQuery(usePpaListStore.getState().query)) return;
    }
    syncedRef.current = urlKey;
    usePpaListStore.getState().replaceQuery(parsePowerListQuery(new URLSearchParams(urlKey)));
    void usePpaListStore.getState().fetch();
  }, [urlKey]);

  // store -> URL + fetch. Reads the store directly: on the mount commit `query` is stale.
  useEffect(() => {
    if (syncedRef.current === null) return;
    const s = serializePowerListQuery(usePpaListStore.getState().query);
    if (s === syncedRef.current) return;
    syncedRef.current = s;
    if (s !== currentUrlRef.current) pendingRef.current = [...pendingRef.current, s];
    router.replace(pathname + (s ? `?${s}` : ''), { scroll: false });
    void usePpaListStore.getState().fetch();
  }, [query, pathname, router]);
}
