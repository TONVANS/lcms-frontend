import { afterEach, describe, expect, it, vi } from 'vitest';
import { csvStamp, downloadCsv, toCsv } from './export-csv';

const BOM = '﻿';

describe('toCsv', () => {
  it('starts with a UTF-8 BOM and uses CRLF', () => {
    expect(toCsv(['a'], [['x']])).toBe(`${BOM}"a"\r\n"x"\r\n`);
  });

  it('quotes every cell and doubles quotes', () => {
    expect(toCsv(['h'], [['say "hi"']])).toContain('"say ""hi"""');
  });

  it('null is an empty quoted cell; numbers are plain', () => {
    expect(toCsv(['a', 'b'], [[null, 1500000.5]])).toContain('"","1500000.5"');
  });

  it('string cells starting with = + - @ get a leading apostrophe', () => {
    const csv = toCsv(['a', 'b', 'c', 'd', 'e'], [['=SUM(A1)', '-5', '+1', '@x', -5]]);
    expect(csv).toContain(`"'=SUM(A1)","'-5","'+1","'@x","-5"`);
  });

  it('keeps Lao text and newlines inside a quoted cell', () => {
    const csv = toCsv(['h'], [['ສະບາຍດີ\nline2']]);
    expect(csv).toContain('"ສະບາຍດີ\nline2"');
  });
});

describe('csvStamp', () => {
  it('returns the local date as yyyy-MM-dd', () => {
    expect(csvStamp(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a text/csv blob link, clicks it and revokes the URL', () => {
    const create = vi.fn(() => 'blob:mock');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: create, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revoke, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('f.csv', 'data');

    const blob = (create.mock.calls[0] as unknown as [Blob])[0];
    expect(blob.type).toBe('text/csv;charset=utf-8');
    const clicked = click.mock.contexts[0] as HTMLAnchorElement;
    expect(click).toHaveBeenCalledTimes(1);
    expect(clicked.download).toBe('f.csv');
    expect(clicked.href).toContain('blob:mock');
    expect(revoke).toHaveBeenCalledWith('blob:mock');
    expect(document.body.querySelector('a')).toBeNull();
  });
});
