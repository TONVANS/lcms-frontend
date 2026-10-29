import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLogoutResets } from '@/lib/auth/logout-registry';
import type { Paginated } from '@/types/api';
import { legalDocumentsService } from '../documents/api/legal-documents.service';
import {
  legalDocumentsQueryCodec,
  useLegalDocumentsListStore as s,
} from '../documents/store/legal-documents-list.store';
import type { LegalDocument } from '../documents/types';
import { createListStore } from './create-list-store';

const DEFAULTS = legalDocumentsQueryCodec.defaults;

const mk = (id: string): LegalDocument => ({
  id,
  docTitle: id,
  docType: 'MANUAL',
  issueYear: 2026,
  docNumberDate: id,
  status: 'ACTIVE',
  responsiblePerson: null,
  departmentId: null,
  department: null,
  purpose: null,
  externalUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const pageOf = (items: LegalDocument[], page = 1, total = items.length): Paginated<LegalDocument> => ({
  items,
  page,
  pageSize: 10,
  total,
});

beforeEach(() => {
  vi.restoreAllMocks();
  s.getState().reset();
});

describe('regulations list store (generic factory)', () => {
  it('setQuery resets page unless given', () => {
    s.getState().setQuery({ page: 3 });
    s.getState().setQuery({ q: 'x' });
    expect(s.getState().query.page).toBe(1);
    expect(s.getState().query.q).toBe('x');
    s.getState().setQuery({ page: 2, status: 'INACTIVE' });
    expect(s.getState().query.page).toBe(2);
  });

  it('replaceQuery replaces rather than patches', () => {
    s.getState().setQuery({ q: 'old', status: 'INACTIVE' });
    s.getState().replaceQuery({ ...DEFAULTS, docType: 'MANUAL' });
    expect(s.getState().query).toEqual({ ...DEFAULTS, docType: 'MANUAL' });
  });

  it('fetch stores items and total from the response', async () => {
    vi.spyOn(legalDocumentsService, 'list').mockResolvedValue(pageOf([mk('a')], 1, 41));
    await s.getState().fetch();
    expect(s.getState().status).toBe('ready');
    expect(s.getState().total).toBe(41);
    expect(s.getState().items).toHaveLength(1);
  });

  it('drops a stale response after reset', async () => {
    let resolve!: (v: Paginated<LegalDocument>) => void;
    vi.spyOn(legalDocumentsService, 'list').mockReturnValue(new Promise((r) => (resolve = r)));
    const p = s.getState().fetch();
    s.getState().reset();
    resolve(pageOf([mk('a')]));
    await p;
    expect(s.getState().items).toEqual([]);
    expect(s.getState().status).toBe('idle');
  });

  it('drops an older response that resolves after a newer fetch', async () => {
    const resolvers: ((v: Paginated<LegalDocument>) => void)[] = [];
    vi.spyOn(legalDocumentsService, 'list').mockImplementation(
      () => new Promise((r) => resolvers.push(r)),
    );
    const p1 = s.getState().fetch();
    const p2 = s.getState().fetch();
    resolvers[1]!(pageOf([mk('new')]));
    resolvers[0]!(pageOf([mk('old')]));
    await Promise.all([p1, p2]);
    expect(s.getState().items.map((i) => i.id)).toEqual(['new']);
  });

  it('sets status error and normalized error on failure', async () => {
    vi.spyOn(legalDocumentsService, 'list').mockRejectedValue(new Error('boom'));
    await s.getState().fetch();
    expect(s.getState().status).toBe('error');
    expect(s.getState().error).not.toBeNull();
    expect(typeof s.getState().error?.code).toBe('string');
  });

  it('leaves state unchanged on a canceled request', async () => {
    s.setState({ items: [mk('keep')], status: 'ready', total: 1 });
    vi.spyOn(legalDocumentsService, 'list').mockRejectedValue(
      new AxiosError('canceled', AxiosError.ERR_CANCELED),
    );
    await s.getState().fetch();
    expect(s.getState().items).toHaveLength(1);
    expect(s.getState().error).toBeNull();
    expect(s.getState().status).toBe('ready');
  });

  it('afterDelete steps back when the last page empties', async () => {
    s.getState().setQuery({ page: 3 });
    const ten = Array.from({ length: 10 }, (_, i) => mk(`p2-${i}`));
    vi.spyOn(legalDocumentsService, 'list').mockImplementation(async (q) =>
      q?.page === 3 ? pageOf([], 3, 20) : pageOf(ten, 2, 20),
    );
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(2);
    expect(s.getState().items).toHaveLength(10);
  });

  it('afterDelete stays on page 1 when empty', async () => {
    vi.spyOn(legalDocumentsService, 'list').mockResolvedValue(pageOf([], 1, 0));
    await s.getState().afterDelete();
    expect(s.getState().query.page).toBe(1);
  });

  it('is cleared by logout resets', () => {
    s.setState({ items: [mk('x')] });
    s.getState().setQuery({ q: 'x' });
    runLogoutResets();
    expect(s.getState().items).toEqual([]);
    expect(s.getState().query).toEqual(DEFAULTS);
  });

  it('two stores created by the factory do not share generation or state', async () => {
    const fetchA = vi.fn().mockResolvedValue(pageOf([mk('a')]));
    const fetchB = vi.fn().mockResolvedValue(pageOf([mk('b')]));
    const a = createListStore<LegalDocument, typeof DEFAULTS>(fetchA, DEFAULTS);
    const b = createListStore<LegalDocument, typeof DEFAULTS>(fetchB, DEFAULTS);

    // A's in-flight fetch must survive a fetch and a reset on B.
    let resolveA!: (v: Paginated<LegalDocument>) => void;
    fetchA.mockReturnValueOnce(new Promise((r) => (resolveA = r)));
    const pa = a.getState().fetch();
    await b.getState().fetch();
    b.getState().reset();
    b.getState().setQuery({ q: 'only-b' });
    resolveA(pageOf([mk('a')]));
    await pa;

    expect(a.getState().items.map((i) => i.id)).toEqual(['a']);
    expect(a.getState().status).toBe('ready');
    expect(a.getState().query.q).toBeUndefined();
    expect(b.getState().query.q).toBe('only-b');
    expect(b.getState().items).toEqual([]);
  });
});
