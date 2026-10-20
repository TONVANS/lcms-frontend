import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf8');

const ROOT = /^:root\s*\{([^}]*)\}/m;
const DARK = /^\.dark\s*\{([^}]*)\}/m;
const block = (source: string, sel: RegExp) => source.match(sel)![1];
const charts = (body: string) => [...body.matchAll(/--chart-\d:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1].toUpperCase());

const rootBody = block(css, ROOT);
const darkBody = block(css, DARK);

describe('globals.css tokens', () => {
  it('defines --text in both themes, scoped to each block', () => {
    expect(rootBody).toMatch(/--text:\s*#0B1B3A/i);
    expect(darkBody).toMatch(/--text:\s*#E8EEF9/i);
  });

  it('defines --text-error (AA error text) in both themes, scoped to each block', () => {
    expect(rootBody).toMatch(/--text-error:\s*#be123c/i);
    expect(darkBody).toMatch(/--text-error:\s*#fda4af/i);
    expect(css).toMatch(/--color-error:\s*var\(--text-error\)/);
  });

  it('block extraction is scoped (dark value only in :root does not satisfy the dark block)', () => {
    const mutated = css.replace(/(\.dark\s*\{[^}]*?)--text:\s*#e8eef9;/i, '$1').replace(/(:root\s*\{)/, '$1\n  --text: #e8eef9;');
    expect(block(mutated, DARK)).not.toMatch(/--text:\s*#E8EEF9/i);
    expect(block(mutated, ROOT)).toMatch(/--text:\s*#E8EEF9/i);
  });

  it('chart tokens never reuse reserved status colours', () => {
    const reserved = ['#34D399', '#059669', '#60A5FA', '#2563EB', '#A78BFA', '#7C3AED', '#FBBF24', '#FB7185', '#E11D48', '#94A3B8'];
    const all = [...charts(rootBody), ...charts(darkBody)];
    expect(all).toHaveLength(10);
    for (const c of all) expect(reserved).not.toContain(c);
  });

  it('defines chart tokens with the pinned values per theme', () => {
    expect(charts(rootBody)).toEqual(['#0369A1', '#4338CA', '#8A6A2F', '#6D28D9', '#0E7490']);
    expect(charts(darkBody)).toEqual(['#5CC8FF', '#8B9CFF', '#D4B37A', '#C4B5FD', '#22D3EE']);
  });

  it('defines module series gradient stops in :root only', () => {
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
      expect(rootBody).toMatch(new RegExp(`--series-${k}:\\s*${v}`, 'i'));
    }
    expect(darkBody).not.toMatch(/--series-/);
  });

  it('defines --row-hover per theme', () => {
    expect(rootBody).toMatch(/--row-hover:\s*rgba\(11,\s*27,\s*58,\s*0\.05\)/);
    expect(darkBody).toMatch(/--row-hover:\s*rgba\(255,\s*255,\s*255,\s*0\.045\)/);
  });
});
