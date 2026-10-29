import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupsService } from '../api/lookups.service';
import { useLookupsStore } from '../store/lookups.store';
import { useContractTypes, useDepartments, useProjectTypes } from './use-lookups';

beforeEach(() => useLookupsStore.getState().reset());
afterEach(() => vi.restoreAllMocks());

describe('lookup hooks', () => {
  it('useDepartments loads on mount and exposes items/status/error/reload', async () => {
    const spy = vi.spyOn(lookupsService, 'departments').mockResolvedValue([{ id: 'd', name: 'A', code: null }]);
    const { result } = renderHook(() => useDepartments());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBeNull();
    result.current.reload();
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });

  it('useContractTypes and useProjectTypes load their own keys', async () => {
    vi.spyOn(lookupsService, 'contractTypes').mockResolvedValue([{ id: 1, nameLo: 'a', nameEn: null }]);
    vi.spyOn(lookupsService, 'projectTypes').mockResolvedValue(['p']);
    const c = renderHook(() => useContractTypes());
    const p = renderHook(() => useProjectTypes());
    await waitFor(() => expect(c.result.current.items).toHaveLength(1));
    await waitFor(() => expect(p.result.current.items).toEqual(['p']));
  });
});
