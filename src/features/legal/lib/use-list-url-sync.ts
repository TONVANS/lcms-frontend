'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { ListState } from './create-list-store';
import type { ListQueryBase, QueryCodec } from './list-query-codec';

/**
 * Keeps a list store and the URL in sync. The consumer must render this under a Suspense boundary (useSearchParams under cacheComponents).
 */
export function useListUrlSync<Q extends ListQueryBase>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: UseBoundStore<StoreApi<ListState<any, Q>>>,
  codec: QueryCodec<Q>,
): void {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useStore((s) => s.query);

  // Canonical string last applied in either direction; the effects below skip when equal.
  const syncedRef = useRef<string | null>(null);
  // Our own pushes in order; an echo drops itself and every earlier entry (coalesced pushes never echo).
  const pendingRef = useRef<string[]>([]);
  const currentUrlRef = useRef<string>('');

  const urlKey = codec.serialize(codec.parse(new URLSearchParams(searchParams)));

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
      if (urlKey === codec.serialize(useStore.getState().query)) return;
    }
    syncedRef.current = urlKey;
    useStore.getState().replaceQuery(codec.parse(new URLSearchParams(urlKey)));
    void useStore.getState().fetch();
  }, [urlKey, codec, useStore]);

  // store -> URL + fetch. Reads the store directly: on the mount commit `query` is stale.
  useEffect(() => {
    if (syncedRef.current === null) return;
    const s = codec.serialize(useStore.getState().query);
    if (s === syncedRef.current) return;
    syncedRef.current = s;
    if (s !== currentUrlRef.current) pendingRef.current = [...pendingRef.current, s];
    router.replace(pathname + (s ? `?${s}` : ''), { scroll: false });
    void useStore.getState().fetch();
  }, [query, pathname, router, codec, useStore]);
}
