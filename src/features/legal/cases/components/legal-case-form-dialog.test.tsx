import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { legalCasesService } from '../api/legal-cases.service';
import { toLegalCase } from '../lib/legal-case-mapper';
import { legalCasesMockDb } from '../mocks/legal-cases.mock';
import type { LegalCase } from '../types';
import { LegalCaseFormDialog } from './legal-case-form-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const F = lo.legal.fields;
const L = lo.legal.cases.form;

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

function setup(legalCase?: LegalCase) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  render(<LegalCaseFormDialog open onOpenChange={onOpenChange} legalCase={legalCase} onSaved={onSaved} />);
  return { onSaved, onOpenChange };
}

const saveBtn = () => screen.getByRole('button', { name: new RegExp('^(' + L.save + '|' + L.saving + ')$') });
const label = (text: string) => screen.getByLabelText(new RegExp(text));

async function pickToday(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: new RegExp(F.date) }));
  await user.click(await screen.findByRole('button', { name: new RegExp('^' + lo.datePicker.today + ', ') }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalCasesMockDb.reset(new Date());
  session('legal.editor');
});

describe('LegalCaseFormDialog', () => {
  it('shows required errors and does not call the service when empty', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalCasesService, 'create');
    setup();
    await user.click(saveBtn());
    expect((await screen.findAllByText(lo.legal.validation.required)).length).toBeGreaterThanOrEqual(3);
    expect(create).not.toHaveBeenCalled();
  });

  it('create sends the DTO (amounts default to 0, no totalDue) and calls onSaved', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalCasesService, 'create');
    const { onSaved, onOpenChange } = setup();

    expect(screen.getByRole('dialog')).toHaveTextContent(L.createTitle);
    await user.type(label(F.caseCode), 'EDL-TEST-1');
    await user.type(label(F.defendant), 'Defendant A');
    await pickToday(user);
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const sent = create.mock.calls[0][0];
    expect(sent).toMatchObject({
      caseCode: 'EDL-TEST-1',
      defendant: 'Defendant A',
      caseType: 'CIVIL',
      disputeStatus: 'FIRST_INSTANCE',
      damageLak: 0,
      damageUsd: 0,
    });
    expect(sent.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect('totalDueLak' in sent).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(L.saved);
  });

  it('typing 1,500,000 in damage LAK sends 1500000 and updates the read-only total', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalCasesService, 'create');
    const { onSaved } = setup();
    await user.type(label(F.caseCode), 'EDL-TEST-2');
    await user.type(label(F.defendant), 'Defendant B');
    await pickToday(user);
    await user.type(screen.getByLabelText(new RegExp(F.damage + '.*LAK')), '1,500,000');
    await user.type(screen.getByLabelText(new RegExp(F.fine + '.*LAK')), '500');
    expect(screen.getByRole('region', { name: F.totalDue })).toHaveTextContent('1,500,500');
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0].damageLak).toBe(1500000);
  });

  it('edit prefills and PATCHes only the changed fields', async () => {
    const user = userEvent.setup();
    const c = toLegalCase(legalCasesMockDb.all()[0]);
    const update = vi.spyOn(legalCasesService, 'update');
    const { onSaved } = setup(c);

    expect(screen.getByRole('dialog')).toHaveTextContent(L.editTitle);
    expect(label(F.caseCode)).toHaveValue(c.caseCode);
    expect(label(F.defendant)).toHaveValue(c.defendant);

    await user.clear(label(F.defendant));
    await user.type(label(F.defendant), 'Renamed');
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(c.id, { defendant: 'Renamed' });
  });

  it('a duplicate case code (409) lands on the caseCode field', async () => {
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.type(label(F.caseCode), legalCasesMockDb.all()[1].caseCode);
    await user.type(label(F.defendant), 'Dup');
    await pickToday(user);
    await user.click(saveBtn());
    expect(await screen.findByText(lo.legal.validation.caseCodeDuplicate)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
