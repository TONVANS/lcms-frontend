import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lookupsService } from './lookups.service';

beforeEach(() => {
  installMocks(api, { delay: 0 });
  setMockSession('gc.user', false);
});
afterEach(() => clearMockSession());

describe('lookupsService', () => {
  it('departments() returns at least 8 mapped departments', async () => {
    const items = await lookupsService.departments();
    expect(items.length).toBeGreaterThanOrEqual(8);
    expect(items[0]).toEqual({ id: expect.any(String), name: expect.any(String), code: expect.anything() });
  });

  it('contractTypes() returns the 14 types with numeric ids', async () => {
    const items = await lookupsService.contractTypes();
    expect(items).toHaveLength(14);
    expect(typeof items[0].id).toBe('number');
    expect(items[0].nameLo).toBeTruthy();
  });

  it('projectTypes() returns the 5 project types as strings', async () => {
    const items = await lookupsService.projectTypes();
    expect(items).toHaveLength(5);
    expect(typeof items[0]).toBe('string');
  });

  it('401 without a session', async () => {
    clearMockSession();
    await expect(lookupsService.departments()).rejects.toMatchObject({ status: 401 });
  });
});
