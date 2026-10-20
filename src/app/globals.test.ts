import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf8');

describe('globals.css tokens', () => {
  it('defines --text in both themes', () => {
    expect(css).toMatch(/:root[^}]*--text:\s*#0B1B3A/i);
    expect(css).toMatch(/\.dark[^}]*--text:\s*#E8EEF9/i);
  });

  it('chart tokens never reuse reserved status colours', () => {
    const reserved = ['#34D399', '#059669', '#60A5FA', '#2563EB', '#A78BFA', '#7C3AED', '#FBBF24', '#FB7185', '#E11D48', '#94A3B8'];
    const charts = [...css.matchAll(/--chart-\d:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toUpperCase());
    expect(charts).toHaveLength(10);
    for (const c of charts) expect(reserved).not.toContain(c);
  });

  it('defines chart tokens with the pinned values', () => {
    const dark = ['#5CC8FF', '#8B9CFF', '#D4B37A', '#C4B5FD', '#22D3EE'];
    const light = ['#0369A1', '#4338CA', '#8A6A2F', '#6D28D9', '#0E7490'];
    const charts = [...css.matchAll(/--chart-\d:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toUpperCase());
    expect(charts.slice(0, 5)).toEqual(light);
    expect(charts.slice(5)).toEqual(dark);
  });

  it('defines module series gradient stops', () => {
    const stops: Record<string, string> = {
      'ppa-from': '#2563EB',
      'ppa-to': '#5CC8FF',
      'gc-from': '#4F46E5',
      'gc-to': '#8B9CFF',
      'legal-from': '#9C7C45',
      'legal-to': '#D4B37A',
      'litigation-from': '#6D28D9',
      'litigation-to': '#C4B5FD',
    };
    for (const [k, v] of Object.entries(stops)) {
      expect(css).toMatch(new RegExp(`--series-${k}:\\s*${v}`, 'i'));
    }
  });
});
