import { beforeEach, describe, expect, it } from 'vitest';
import { sumDual } from '@/features/legal/cases/lib/case-money';
import { casesService } from '@/features/legal/cases/api/cases.service';
import { casesMockDb } from '@/features/legal/cases/mocks/cases.mock';
import { CASE_STAGES, type CaseInput, type LegalCase } from '@/features/legal/cases/types';
import { legalDashboardService } from '@/features/legal/dashboard/api/legal-dashboard.service';
import { regulationsService } from '@/features/legal/regulations/api/regulations.service';
import { regulationsMockDb } from '@/features/legal/regulations/mocks/regulations.mock';
import type { RegulationInput } from '@/features/legal/regulations/schemas/regulation.schema';
import { REGULATION_TYPES, type Regulation } from '@/features/legal/regulations/types';
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
  casesMockDb.reset(new Date());
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

const sampleCaseInput: CaseInput = {
  defendant: 'ທ້າວ ບຸນມີ',
  allegation: 'ລັກສາຍໄຟຟ້າ',
  handlingUnit: 'ສານປະຊາຊົນນະຄອນຫຼວງ',
  caseType: 'criminal',
  stage: 'first_instance',
  damage: { lak: 10000000, usd: null },
  fine: { lak: 2000000, usd: null },
  recovered: { lak: 0, usd: null },
  disputeDate: '2026-05-10',
  progress: 'ກຳລັງດຳເນີນຄະດີ',
};

const toCaseInput = (c: LegalCase): CaseInput => ({
  defendant: c.defendant,
  allegation: c.allegation,
  handlingUnit: c.handlingUnit,
  caseType: c.caseType,
  stage: c.stage,
  damage: { ...c.damage },
  fine: { ...c.fine },
  recovered: { ...c.recovered },
  disputeDate: c.disputeDate,
  progress: c.progress,
});

describe('legal cases handlers', () => {
  it('401 without session; 403 for create/edit/delete as legal.viewer; legal.editor can create', async () => {
    await expect(casesService.list()).rejects.toMatchObject({ status: 401 });
    setMockSession('legal.viewer', false);
    const [first] = casesMockDb.all();
    await expect(casesService.create(sampleCaseInput)).rejects.toMatchObject({ status: 403 });
    await expect(casesService.update(first.id, toCaseInput(first))).rejects.toMatchObject({
      status: 403,
    });
    await expect(casesService.remove(first.id)).rejects.toMatchObject({ status: 403 });
    expect(casesMockDb.get(first.id)).toBeDefined();
    setMockSession('legal.editor', false);
    await expect(casesService.create(sampleCaseInput)).resolves.toMatchObject({
      defendant: sampleCaseInput.defendant,
    });
  });

  it('default sort disputeDate desc with the null date last', async () => {
    setMockSession('legal.viewer', false);
    const r = await casesService.list();
    expect(r.items).toHaveLength(10);
    expect(r.total).toBe(24);
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(10);

    const all = await casesService.list({ pageSize: 'all' });
    expect(all.items.at(-1)?.disputeDate).toBeNull();
    const nonNullDates = all.items.slice(0, -1).map((x) => x.disputeDate!);
    expect(nonNullDates).toEqual([...nonNullDates].sort().reverse());

    const asc = await casesService.list({ order: 'asc', pageSize: 'all' });
    expect(asc.items.at(-1)?.disputeDate).toBeNull();
    const nonNullAsc = asc.items.slice(0, -1).map((x) => x.disputeDate!);
    expect(nonNullAsc).toEqual([...nonNullAsc].sort());
  });

  it('progress=finished returns only completed and closed', async () => {
    setMockSession('legal.viewer', false);
    const fin = await casesService.list({ progress: 'finished', pageSize: 'all' });
    expect(fin.items.every((c) => c.stage === 'completed' || c.stage === 'closed')).toBe(true);
    expect(fin.total).toBeGreaterThan(0);

    const inProg = await casesService.list({ progress: 'in_progress', pageSize: 'all' });
    expect(inProg.items.every((c) => c.stage !== 'completed' && c.stage !== 'closed')).toBe(true);
    expect(fin.total + inProg.total).toBe(24);
  });

  it('stage=bogus falls back to no stage filter', async () => {
    setMockSession('legal.viewer', false);
    const r = await casesService.list({ stage: 'bogus' as never, pageSize: 'all' });
    expect(r.total).toBe(24);
  });

  it('q matches progress text', async () => {
    setMockSession('legal.viewer', false);
    const [withProgress] = casesMockDb
      .all()
      .filter((c) => c.progress !== null && c.progress.length > 5);
    const snippet = withProgress.progress!.slice(0, 5);
    const r = await casesService.list({ q: snippet });
    expect(r.items.map((x) => x.id)).toContain(withProgress.id);
  });

  it('pageSize=all with caseType filter returns all matching rows', async () => {
    setMockSession('legal.viewer', false);
    const r = await casesService.list({ caseType: 'criminal', pageSize: 'all' });
    expect(r.items.length).toBe(r.total);
    expect(r.pageSize).toBe(r.total);
    expect(r.page).toBe(1);
    expect(r.total).toBe(casesMockDb.all().filter((c) => c.caseType === 'criminal').length);
  });

  it('POST ignores a client-sent caseNo and assigns one', async () => {
    setMockSession('legal.editor', false);
    const created = await casesService.create({
      ...sampleCaseInput,
      caseNo: 'LC-9999-999',
    } as unknown as CaseInput);
    expect(created.caseNo).not.toBe('LC-9999-999');
    expect(created.caseNo).toMatch(/^LC-\d{4}-\d{3}$/);
  });

  it('PATCH and DELETE 404 for an unknown id', async () => {
    setMockSession('legal.editor', false);
    await expect(casesService.get('case-1')).resolves.toMatchObject({ id: 'case-1' });
    const notFound = { status: 404, code: 'NOT_FOUND' };
    await expect(casesService.get('nope')).rejects.toMatchObject(notFound);
    await expect(casesService.update('nope', sampleCaseInput)).rejects.toMatchObject(notFound);
    await expect(casesService.remove('nope')).rejects.toMatchObject(notFound);
    await casesService.remove('case-1');
    await expect(casesService.get('case-1')).rejects.toMatchObject(notFound);
    expect(casesMockDb.all()).toHaveLength(23);
  });
});

describe('legal dashboard handler', () => {
  it('401 without session', async () => {
    await expect(legalDashboardService.get()).rejects.toMatchObject({ status: 401 });
  });

  it('aggregates the seed', async () => {
    setMockSession('legal.viewer', false);
    const d = await legalDashboardService.get();

    // Regulations assertions
    expect(d.regulations.total).toBe(30);
    const statusSum = Object.values(d.regulations.byStatus).reduce((a, b) => a + b, 0);
    expect(statusSum).toBe(30);

    expect(d.regulations.byType.map((t) => t.type)).toEqual(
      expect.arrayContaining([...REGULATION_TYPES]),
    );
    expect(d.regulations.byType).toHaveLength(6);

    expect(d.regulations.byUnit.length).toBe(d.regulations.unitCount);
    for (const u of d.regulations.byUnit) {
      expect(u.count).toBeGreaterThan(0);
    }
    for (let i = 1; i < d.regulations.byUnit.length; i++) {
      expect(d.regulations.byUnit[i - 1].count).toBeGreaterThanOrEqual(d.regulations.byUnit[i].count);
    }

    // Cases assertions
    expect(d.cases.total).toBe(24);
    expect(d.cases.inProgress + d.cases.finished).toBe(24);
    expect(d.cases.byStage.map((s) => s.stage)).toEqual([...CASE_STAGES]);

    const allCases = casesMockDb.all();
    const expectedDamage = sumDual(allCases.map((c) => c.damage));
    const expectedFine = sumDual(allCases.map((c) => c.fine));
    const expectedRecovered = sumDual(allCases.map((c) => c.recovered));

    expect(d.cases.damage).toEqual(expectedDamage);
    expect(d.cases.fine).toEqual(expectedFine);
    expect(d.cases.recovered).toEqual(expectedRecovered);
  });
});
