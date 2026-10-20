import { describe, expect, it } from 'vitest';
import { config } from './proxy';

// Next anchors the matcher source as a full-path regex.
const re = new RegExp(`^${config.matcher[0]}$`);

describe('proxy matcher', () => {
  it('keeps the escaped dot in the source', () => {
    expect(config.matcher[0]).toContain('.*\\..*');
  });
  it.each(['/', '/ppa', '/contracts/1', '/login'])('matches %s', (p) => {
    expect(re.test(p)).toBe(true);
  });
  it.each(['/brand/logo.svg', '/x.png', '/_next/static/a.js'])('skips %s', (p) => {
    expect(re.test(p)).toBe(false);
  });
});
