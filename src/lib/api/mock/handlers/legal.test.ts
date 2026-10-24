import { beforeEach, describe, expect, it } from 'vitest';
import { regulationsService } from '@/features/legal/regulations/api/regulations.service';
import { regulationsMockDb } from '@/features/legal/regulations/mocks/regulations.mock';
import type { RegulationInput } from '@/features/legal/regulations/schemas/regulation.schema';
import type { Regulation } from '@/features/legal/regulations/types';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const toInput = (r: Regulation): RegulationInput => ({
  title: r.title,
  type: r.type,
  typeOther: r.typeOther,
  number: r.number,
  issuedDate: r.issuedDate,
  year: r.year,
  purpose: r.purpose,
  responsible: r.responsible,
  unit: r.unit,
  status: r.status,
  externalLinks: [...r.externalLinks],
});

const input: RegulationInput = {
  title: 'New regulation',
  type: 'notice',
  typeOther: null,
  number: 'NEW-001/TEST',
  issuedDate: '2026-10-01',
  year: 2026,
  purpose: null,
  responsible: null,
  unit: 'ict',
  status: 'in_force',
  externalLinks: [],
};

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  regulationsMockDb.reset(new Date());
});

describe('legal regulations handlers', () => {
  it('401 without session; 403 for create/edit/delete as legal.viewer; legal.editor can create', async () => {
    await expect(regulationsService.list()).rejects.toMatchObject({ status: 401 });
    setMockSession('legal.viewer', false);
    const [first] = regulationsMockDb.all();
    await expect(regulationsService.create(input)).rejects.toMatchObject({ status: 403 });
    await expect(regulationsService.update(first.id, toInput(first))).rejects.toMatchObject({
      status: 403,
    });
    await expect(regulationsService.remove(first.id)).rejects.toMatchObject({ status: 403 });
    expect(regulationsMockDb.get(first.id)).toBeDefined();
    setMockSession('legal.editor', false);
    await expect(regulationsService.create(input)).resolves.toMatchObject({ number: input.number });
  });

  it('default list is 10 rows sorted by issuedDate desc, total 30', async () => {
    setMockSession('legal.viewer', false);
    const r = await regulationsService.list();
    expect(r.items).toHaveLength(10);
    expect(r.total).toBe(30);
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(10);
    const dates = r.items.map((x) => x.issuedDate);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('filters by type, unit and status, and combines them', async () => {
    setMockSession('legal.viewer', false);
    const all = regulationsMockDb.all();
    const byType = await regulationsService.list({ type: 'decision', pageSize: 'all' });
    expect(byType.total).toBe(all.filter((r) => r.type === 'decision').length);
    expect(byType.items.every((r) => r.type === 'decision')).toBe(true);
    const unit = all[0].unit;
    const byUnit = await regulationsService.list({ unit, pageSize: 'all' });
    expect(byUnit.total).toBe(all.filter((r) => r.unit === unit).length);
    const byStatus = await regulationsService.list({ status: 'repealed', pageSize: 'all' });
    expect(byStatus.total).toBe(all.filter((r) => r.status === 'repealed').length);
    const combined = await regulationsService.list({
      type: 'decision',
      status: 'in_force',
      pageSize: 'all',
    });
    expect(combined.total).toBe(
      all.filter((r) => r.type === 'decision' && r.status === 'in_force').length,
    );
    expect(combined.total).toBeLessThan(byType.total + 1);
  });

  it('search trims spaces and matches number', async () => {
    setMockSession('legal.viewer', false);
    const r = await regulationsService.list({ q: '  351/ ' });
    expect(r.items.map((x) => x.id)).toContain('reg-1');
  });

  it('invalid params fall back to defaults', async () => {
    setMockSession('legal.viewer', false);
    const r = await regulationsService.list({
      type: 'bogus' as never,
      pageSize: 7,
      page: -1,
      sort: 'x' as never,
      order: 'sideways' as never,
    });
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(10);
    expect(r.total).toBe(30);
    const dates = r.items.map((x) => x.issuedDate);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('pageSize=all returns every filtered row', async () => {
    setMockSession('legal.viewer', false);
    const r = await regulationsService.list({ status: 'repealed', pageSize: 'all' });
    expect(r.items.length).toBe(r.total);
    expect(r.pageSize).toBe(r.total);
    expect(r.page).toBe(1);
    expect(r.total).toBeGreaterThan(0);
    expect(r.items.every((x) => x.status === 'repealed')).toBe(true);
  });

  it('title sort uses Lao collation and ties break by id', async () => {
    setMockSession('legal.editor', false);
    const a = await regulationsService.create({ ...input, number: 'T-1', title: 'ເກ' });
    const b = await regulationsService.create({ ...input, number: 'T-2', title: 'ຂ' });
    const r = await regulationsService.list({ sort: 'title', order: 'asc', pageSize: 'all' });
    const ids = r.items.map((x) => x.id);
    expect(ids.indexOf(a.id)).toBeLessThan(ids.indexOf(b.id));
    const same = await regulationsService.list({ sort: 'issuedDate', order: 'asc', pageSize: 'all' });
    const tied = same.items.filter((x) => x.issuedDate === '2026-10-01').map((x) => x.id);
    expect(tied).toEqual([...tied].sort());
  });

  it('POST with an existing number (different case, padded) returns 409 on number', async () => {
    setMockSession('legal.editor', false);
    await regulationsService.create({ ...input, number: 'abc-1/x' });
    await expect(
      regulationsService.create({ ...input, number: '  ABC-1/X ' }),
    ).rejects.toMatchObject({
      status: 409,
      fieldErrors: { number: 'DUPLICATE_REGULATION_NO' },
    });
    const [first] = regulationsMockDb.all().filter((r) => r.id === 'reg-1');
    await expect(regulationsService.create({ ...input, number: first.number })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('PATCH keeping its own number succeeds; another record number is 409', async () => {
    setMockSession('legal.editor', false);
    const [first, second] = regulationsMockDb.all();
    await expect(regulationsService.update(first.id, toInput(first))).resolves.toMatchObject({
      id: first.id,
    });
    await expect(
      regulationsService.update(second.id, { ...toInput(second), number: first.number }),
    ).rejects.toMatchObject({ status: 409, fieldErrors: { number: 'DUPLICATE_REGULATION_NO' } });
  });

  it('GET returns an existing record; GET/PATCH/DELETE unknown id return NOT_FOUND', async () => {
    setMockSession('legal.editor', false);
    await expect(regulationsService.get('reg-1')).resolves.toMatchObject({ id: 'reg-1' });
    const notFound = { status: 404, code: 'NOT_FOUND' };
    await expect(regulationsService.get('nope')).rejects.toMatchObject(notFound);
    await expect(regulationsService.update('nope', input)).rejects.toMatchObject(notFound);
    await expect(regulationsService.remove('nope')).rejects.toMatchObject(notFound);
  });

  it('DELETE removes the record', async () => {
    setMockSession('legal.editor', false);
    await regulationsService.remove('reg-1');
    await expect(regulationsService.get('reg-1')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(regulationsMockDb.all()).toHaveLength(29);
  });
});
