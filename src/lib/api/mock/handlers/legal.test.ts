import { beforeEach, describe, expect, it } from 'vitest';
import { legalCasesService } from '@/features/legal/cases/api/legal-cases.service';
import { legalCasesMockDb } from '@/features/legal/cases/mocks/legal-cases.mock';
import { CASE_TYPES, DISPUTE_STATUSES, type LegalCasePayload } from '@/features/legal/cases/types';
import { legalDocumentsService } from '@/features/legal/documents/api/legal-documents.service';
import { legalDocumentsMockDb } from '@/features/legal/documents/mocks/legal-documents.mock';
import { DOC_STATUSES, DOC_TYPES, type LegalDocumentPayload } from '@/features/legal/documents/types';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';

const docInput: LegalDocumentPayload = {
  docTitle: 'New doc',
  docType: 'NOTIFICATION',
  issueYear: 2026,
  docNumberDate: 'No 1',
  status: 'ACTIVE',
  departmentId: MOCK_DEPARTMENTS[0].id,
};
const caseInput: LegalCasePayload = {
  caseCode: 'NEW-001',
  defendant: 'Someone',
  caseType: 'CIVIL',
  disputeStatus: 'APPEAL',
  date: '2026-10-01',
  damageLak: 100,
  damageUsd: 0,
  fineLak: 50,
  fineUsd: 0,
  recoveredLak: 0,
  recoveredUsd: 0,
};

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  legalDocumentsMockDb.reset(new Date());
  legalCasesMockDb.reset(new Date());
});

describe('seed data', () => {
  it('has at least 25 documents and cases covering every enum value', () => {
    const docs = legalDocumentsMockDb.all();
    const cases = legalCasesMockDb.all();
    expect(docs.length).toBeGreaterThanOrEqual(25);
    expect(cases.length).toBeGreaterThanOrEqual(25);
    expect(new Set(docs.map((d) => d.docType))).toEqual(new Set(DOC_TYPES));
    expect(new Set(docs.map((d) => d.status))).toEqual(new Set(DOC_STATUSES));
    expect(new Set(cases.map((c) => c.caseType))).toEqual(new Set(CASE_TYPES));
    expect(new Set(cases.map((c) => c.disputeStatus))).toEqual(new Set(DISPUTE_STATUSES));
    expect(legalDocumentsMockDb.get('reg-1')).toBeDefined();
    expect(legalDocumentsMockDb.get('reg-2')).toBeDefined();
    expect(legalCasesMockDb.get('case-1')).toBeDefined();
    expect(docs.some((d) => typeof d.issueYear === 'string')).toBe(true);
    expect(cases.some((c) => typeof c.damageLak === 'string')).toBe(true);
  });
});

describe('legal documents handlers', () => {
  it('401 without a session', async () => {
    await expect(legalDocumentsService.list()).rejects.toMatchObject({ status: 401 });
  });

  it('403 for users without the legal-documents module, and for writes without the flag', async () => {
    setMockSession('gc.user', false);
    await expect(legalDocumentsService.list()).rejects.toMatchObject({ status: 403 });
    setMockSession('legal.viewer', false);
    await expect(legalDocumentsService.list()).resolves.toBeDefined();
    await expect(legalDocumentsService.create(docInput)).rejects.toMatchObject({ status: 403 });
    await expect(legalDocumentsService.update('reg-1', { docTitle: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(legalDocumentsService.remove('reg-1')).rejects.toMatchObject({ status: 403 });
    setMockSession('legal.editor', false);
    await expect(legalDocumentsService.create(docInput)).resolves.toMatchObject({ docTitle: 'New doc' });
  });

  it('lists with envelope meta, paging and filters', async () => {
    setMockSession('legal.user', false);
    const res = await api.get('/legal-documents', { params: { page: 2, limit: 10 } });
    expect(res.data.meta).toMatchObject({ total: legalDocumentsMockDb.all().length, page: 2, limit: 10 });
    expect(res.data.meta.totalPages).toBe(Math.ceil(res.data.meta.total / 10));
    expect(res.data.data).toHaveLength(10);

    const manuals = await legalDocumentsService.list({ docType: 'MANUAL', pageSize: 100 });
    expect(manuals.items.length).toBeGreaterThan(0);
    expect(manuals.items.every((d) => d.docType === 'MANUAL')).toBe(true);
    const inactive = await legalDocumentsService.list({ status: 'INACTIVE', pageSize: 100 });
    expect(inactive.items.every((d) => d.status === 'INACTIVE')).toBe(true);
    const dep = MOCK_DEPARTMENTS[1].id;
    const byDep = await legalDocumentsService.list({ departmentId: dep, pageSize: 100 });
    expect(byDep.items.length).toBeGreaterThan(0);
    expect(byDep.items.every((d) => d.departmentId === dep)).toBe(true);
    const year = legalDocumentsMockDb.all()[0].issueYear;
    const byYear = await legalDocumentsService.list({ issueYear: Number(year), pageSize: 100 });
    expect(byYear.items.every((d) => d.issueYear === Number(year))).toBe(true);
    const search = await legalDocumentsService.list({ q: 'KPI' });
    expect(search.items.map((d) => d.id)).toContain('reg-1');
  });

  it('create, get, patch (null clears), delete', async () => {
    setMockSession('legal.user', false);
    const created = await legalDocumentsService.create({ ...docInput, purpose: 'p' });
    expect(created.department?.id).toBe(MOCK_DEPARTMENTS[0].id);
    expect(await legalDocumentsService.get(created.id)).toMatchObject({ purpose: 'p' });
    const patched = await legalDocumentsService.update(created.id, { purpose: null, docTitle: 'Renamed' });
    expect(patched).toMatchObject({ purpose: null, docTitle: 'Renamed' });
    await legalDocumentsService.remove(created.id);
    await expect(legalDocumentsService.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('400 with a Nest-style message array when required fields are missing', async () => {
    setMockSession('legal.user', false);
    const err = await api.post('/legal-documents', { docType: 'MANUAL' }).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 400 });
    expect((err as { message: string }).message).toContain('docTitle should not be empty');
    expect((err as { message: string }).message).toContain('departmentId');
  });

  it('dashboard returns totals, byType and byDepartment', async () => {
    setMockSession('legal.viewer', false);
    const d = await legalDocumentsService.dashboard();
    const all = legalDocumentsMockDb.all();
    expect(d.total).toBe(all.length);
    expect(d.active + d.inactive).toBe(all.length);
    expect(d.byType.reduce((s, t) => s + t.count, 0)).toBe(all.length);
    expect(d.byDepartment.reduce((s, t) => s + t.count, 0)).toBe(all.length);
    expect(d.byDepartment[0].name).not.toBe('');
  });
});

describe('legal cases handlers', () => {
  it('401, 403 without the legal-cases module and 403 for viewer writes', async () => {
    await expect(legalCasesService.list()).rejects.toMatchObject({ status: 401 });
    setMockSession('ppa.user', false);
    await expect(legalCasesService.list()).rejects.toMatchObject({ status: 403 });
    setMockSession('legal.viewer', false);
    await expect(legalCasesService.create(caseInput)).rejects.toMatchObject({ status: 403 });
    await expect(legalCasesService.update('case-1', { defendant: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(legalCasesService.remove('case-1')).rejects.toMatchObject({ status: 403 });
  });

  it('lists with filters and date range, items use internalId as id', async () => {
    setMockSession('legal.user', false);
    const all = await legalCasesService.list({ pageSize: 100 });
    expect(all.total).toBeGreaterThanOrEqual(25);
    expect(all.items.map((c) => c.id)).toContain('case-1');
    const appeal = await legalCasesService.list({ disputeStatus: 'APPEAL', pageSize: 100 });
    expect(appeal.items.length).toBeGreaterThan(0);
    expect(appeal.items.every((c) => c.disputeStatus === 'APPEAL')).toBe(true);
    const civil = await legalCasesService.list({ caseType: 'CIVIL', pageSize: 100 });
    expect(civil.items.every((c) => c.caseType === 'CIVIL')).toBe(true);
    const dates = all.items.map((c) => c.date!).sort();
    const range = await legalCasesService.list({ startDate: dates[3], endDate: dates[10], pageSize: 100 });
    expect(range.items.length).toBeGreaterThan(0);
    expect(range.items.every((c) => c.date! >= dates[3] && c.date! <= dates[10])).toBe(true);
    const dep = MOCK_DEPARTMENTS[2].id;
    const byDep = await legalCasesService.list({ departmentId: dep, pageSize: 100 });
    expect(byDep.items.every((c) => c.departmentId === dep)).toBe(true);
    expect((await legalCasesService.list({ q: 'EDL-2026-005' })).items.map((c) => c.caseCode)).toContain('EDL-2026-005');
  });

  it('create computes totalDue server-side; patch recomputes it', async () => {
    setMockSession('legal.user', false);
    const created = await legalCasesService.create(caseInput);
    expect(created).toMatchObject({ totalDueLak: 150, caseCode: 'NEW-001' });
    const patched = await legalCasesService.update(created.id, { fineLak: 200, allegation: null });
    expect(patched).toMatchObject({ totalDueLak: 300, allegation: null });
    await legalCasesService.remove(created.id);
    await expect(legalCasesService.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('409 on a duplicate caseCode (create and patch), not for the record itself', async () => {
    setMockSession('legal.user', false);
    const existing = legalCasesMockDb.get('case-2')!.caseCode;
    await expect(legalCasesService.create({ ...caseInput, caseCode: existing })).rejects.toMatchObject({ status: 409 });
    await expect(legalCasesService.update('case-1', { caseCode: existing })).rejects.toMatchObject({ status: 409 });
    await expect(legalCasesService.update('case-2', { caseCode: existing })).resolves.toBeDefined();
  });

  it('400 with a message array on missing required fields', async () => {
    setMockSession('legal.user', false);
    const err = await api.post('/legal-cases', {}).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 400 });
    expect((err as { message: string }).message).toMatch(/caseCode/);
    expect((err as { message: string }).message).toMatch(/date/);
  });

  it('dashboard returns per-status counts and LAK/USD totals', async () => {
    setMockSession('legal.viewer', false);
    const d = await legalCasesService.dashboard();
    const all = legalCasesMockDb.all();
    expect(d.total).toBe(all.length);
    expect(d.byDisputeStatus.reduce((s, e) => s + e.count, 0)).toBe(all.length);
    expect(d.lak.damage).toBe(all.reduce((s, c) => s + Number(c.damageLak), 0));
    expect(d.lak.totalDue).toBeGreaterThanOrEqual(d.lak.damage);
  });
});
