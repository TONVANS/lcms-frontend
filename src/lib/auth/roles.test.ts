import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSIONS } from './roles';

describe('ROLE_PERMISSIONS', () => {
  it('defines the three roles verbatim', () => {
    expect(ROLE_PERMISSIONS.viewer).toEqual(['view']);
    expect(ROLE_PERMISSIONS.editor).toEqual(['view', 'create', 'edit', 'delete']);
    expect(ROLE_PERMISSIONS.main).toEqual(['view', 'create', 'edit', 'delete', 'download']);
  });
});
