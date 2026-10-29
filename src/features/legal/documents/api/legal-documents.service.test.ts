import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { legalDocumentsService, toLegalDocumentListParams } from './legal-documents.service';

beforeEach(() => vi.restoreAllMocks());

describe('toLegalDocumentListParams', () => {
  it('maps store names to backend names and omits empties', () => {
    expect(
      toLegalDocumentListParams({
        page: 2,
        pageSize: 25,
        q: ' abc ',
        docType: 'MANUAL',
        status: 'ACTIVE',
        issueYear: 2025,
        departmentId: 'd1',
      }),
    ).toEqual({ page: 2, limit: 25, search: 'abc', docType: 'MANUAL', status: 'ACTIVE', issueYear: 2025, departmentId: 'd1' });
    expect(toLegalDocumentListParams({ page: 1, pageSize: 10, q: '  ' })).toEqual({ page: 1, limit: 10 });
    expect(toLegalDocumentListParams()).toEqual({});
  });
});

describe('legalDocumentsService', () => {
  it('list maps rows and meta', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [{ id: 'a', docTitle: 'X', docType: 'MANUAL' }], meta: { total: 41, page: 2, limit: 10, totalPages: 5 } },
    });
    const res = await legalDocumentsService.list({ page: 2, pageSize: 10, q: 'x' });
    expect(get).toHaveBeenCalledWith('/legal-documents', { params: { page: 2, limit: 10, search: 'x' } });
    expect(res.total).toBe(41);
    expect(res.items[0]).toMatchObject({ id: 'a', docTitle: 'X', docType: 'MANUAL' });
  });

  it('create posts the payload and unwraps { data }', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { id: 'n1', docTitle: 'N' } } });
    const res = await legalDocumentsService.create({
      docTitle: 'N', docType: 'OTHER', issueYear: 2026, docNumberDate: 'x', status: 'ACTIVE', departmentId: 'd',
    });
    expect(post.mock.calls[0][0]).toBe('/legal-documents');
    expect(res.id).toBe('n1');
  });

  it('update patches and remove deletes', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: { id: 'a' } } });
    await legalDocumentsService.update('a/b', { docTitle: 'Z' });
    expect(patch).toHaveBeenCalledWith('/legal-documents/a%2Fb', { docTitle: 'Z' });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined });
    await legalDocumentsService.remove('a');
    expect(del).toHaveBeenCalledWith('/legal-documents/a');
  });

  it('listAll walks every page', async () => {
    const rows = (n: number, from: number) => Array.from({ length: n }, (_, i) => ({ id: String(from + i) }));
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: rows(100, 0), meta: { total: 130 } } })
      .mockResolvedValueOnce({ data: { data: rows(30, 100), meta: { total: 130 } } });
    const res = await legalDocumentsService.listAll({ q: 'x', page: 3 });
    expect(res).toHaveLength(130);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1][1]).toEqual({ params: { page: 2, limit: 100, search: 'x' } });
  });

  it('dashboard maps through the tolerant mapper', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { total: 3, active: 2, inactive: 1 } } });
    expect(await legalDocumentsService.dashboard()).toMatchObject({ total: 3, active: 2, inactive: 1 });
  });
});
