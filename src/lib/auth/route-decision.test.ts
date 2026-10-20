import { describe, expect, it } from 'vitest';
import { decideRedirect, getSafeNext } from './route-decision';

describe('getSafeNext', () => {
  it('accepts local paths', () => {
    expect(getSafeNext('/ppa?tab=1')).toBe('/ppa?tab=1');
  });
  it('rejects unsafe values', () => {
    expect(
      ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '', null].map(getSafeNext),
    ).toEqual([null, null, null, null, null, null]);
  });
});

describe('decideRedirect', () => {
  it('redirects anonymous users to login', () => {
    expect(decideRedirect({ pathname: '/ppa', search: '?tab=1', hasSession: false })).toBe('/login?next=%2Fppa%3Ftab%3D1');
    expect(decideRedirect({ pathname: '/', search: '', hasSession: false })).toBe('/login');
  });
  it('handles public routes', () => {
    expect(decideRedirect({ pathname: '/login', search: '', hasSession: false })).toBeNull();
    expect(decideRedirect({ pathname: '/forgot-password', search: '', hasSession: false })).toBeNull();
    expect(decideRedirect({ pathname: '/login', search: '', hasSession: true })).toBe('/');
  });
  it('does not loop on expired reason', () => {
    expect(
      decideRedirect({ pathname: '/login', search: '?reason=expired&next=%2Fppa', hasSession: true }),
    ).toBeNull();
  });
  it('allows authenticated access', () => {
    expect(decideRedirect({ pathname: '/ppa', search: '', hasSession: true })).toBeNull();
  });
});
