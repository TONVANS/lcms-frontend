import { describe, expect, it } from 'vitest';
import { endpoints } from '@/lib/api/endpoints';

describe('endpoints.gc', () => {
  it('builds urls', () => {
    expect(endpoints.gc.list).toBe('/contracts');
    expect(endpoints.gc.detail('abc')).toBe('/contracts/abc');
    expect(endpoints.gc.dashboard).toBe('/contracts/dashboard');
  });
});
