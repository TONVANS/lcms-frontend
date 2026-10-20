'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { parseGcListQuery, serializeGcListQuery } from '../store/gc-list-query';
import { useGcListStore } from '../store/gc-list.store';

/**
 * Keeps the GC list store and the URL in sync. The consumer must render this under a Suspense boundary (useSearchParams under cacheComponents).
 */
export function useGcListUrlSync(): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useGcListStore((s) => s.query);

  // Canonical string last applied in either direction; the effects below skip when equal.
  const syncedRef = useRef<string | null>(null);
  // Last string we pushed ourselves; its echo through useSearchParams is ignored once.
  const pushedRef = useRef<string | null>(null);
  const currentUrlRef = useRef<string>('');

  const urlKey = serializeGcListQuery(parseGcListQuery(new URLSearchParams(searchParams)));

  useEffect(() => {
    currentUrlRef.current = urlKey;
  }, [urlKey]);

  // URL -> store: mount parse and browser back/forward.
  useEffect(() => {
    const first = syncedRef.current === null;
    if (!first) {
      if (pushedRef.current === urlKey) {
        pushedRef.current = null;
        return;
      }
      if (urlKey === serializeGcListQuery(useGcListStore.getState().query)) return;
    }
    syncedRef.current = urlKey;
    useGcListStore.getState().replaceQuery(parseGcListQuery(new URLSearchParams(urlKey)));
    void useGcListStore.getState().fetch();
  }, [urlKey]);

  // store -> URL + fetch. Reads the store directly: on the mount commit `query` is stale.
  useEffect(() => {
    if (syncedRef.current === null) return;
    const s = serializeGcListQuery(useGcListStore.getState().query);
    if (s === syncedRef.current) return;
    syncedRef.current = s;
    pushedRef.current = s !== currentUrlRef.current ? s : null;
    router.replace(pathname + (s ? `?${s}` : ''), { scroll: false });
    void useGcListStore.getState().fetch();
  }, [query, pathname, router]);
}
