import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { legalDocumentsService } from '../api/legal-documents.service';
import { toLegalDocument } from '../lib/legal-document-mapper';
import { legalDocumentsMockDb } from '../mocks/legal-documents.mock';
import type { LegalDocument } from '../types';
import { LegalDocumentFormDialog } from './legal-document-form-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const F = lo.legal.fields;
const L = lo.legal.regulations.form;

function session(username: string) {
  setMockSession(username, false);
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === username)!,
    status: 'authenticated',
  });
}

function setup(doc?: LegalDocument) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  render(<LegalDocumentFormDialog open onOpenChange={onOpenChange} document={doc} onSaved={onSaved} />);
  return { onSaved, onOpenChange };
}

const saveBtn = () => screen.getByRole('button', { name: new RegExp('^(' + L.save + '|' + L.saving + ')$') });
const label = (text: string) => screen.getByLabelText(new RegExp(text));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalDocumentsMockDb.reset(new Date());
  session('legal.editor');
});

describe('LegalDocumentFormDialog', () => {
  it('shows required errors and does not call the service when empty', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalDocumentsService, 'create');
    setup();
    await user.click(saveBtn());
    expect((await screen.findAllByText(lo.legal.validation.required)).length).toBeGreaterThanOrEqual(3);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a javascript: link and a bad year', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalDocumentsService, 'create');
    setup();
    await user.type(label(F.docTitle), 'T');
    await user.type(label(F.docNumberDate), 'N');
    await user.clear(label(F.issueYear));
    await user.type(label(F.issueYear), '1800');
    await user.type(label(F.externalUrl), 'javascript:alert(1)');
    await user.click(saveBtn());
    expect(await screen.findByText(lo.legal.validation.yearRange)).toBeInTheDocument();
    expect(screen.getByText(lo.legal.validation.urlInvalid)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('create sends CreateLegalDocumentDto with the chosen department and calls onSaved', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalDocumentsService, 'create');
    const { onSaved, onOpenChange } = setup();

    expect(screen.getByRole('dialog')).toHaveTextContent(L.createTitle);
    await user.type(label(F.docTitle), 'New regulation');
    await user.type(label(F.docNumberDate), 'No 9, 01/02/2026');
    await user.clear(label(F.issueYear));
    await user.type(label(F.issueYear), '2025');
    await user.click(screen.getByRole('combobox', { name: new RegExp(F.department) }));
    await user.click(await screen.findByRole('option', { name: MOCK_DEPARTMENTS[3].name }));
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      docTitle: 'New regulation',
      docType: 'REGULATION',
      issueYear: 2025,
      docNumberDate: 'No 9, 01/02/2026',
      status: 'ACTIVE',
      departmentId: MOCK_DEPARTMENTS[3].id,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(L.saved);
  });

  it('edit prefills and PATCHes only the changed fields', async () => {
    const user = userEvent.setup();
    const d = toLegalDocument(legalDocumentsMockDb.all()[0]);
    const update = vi.spyOn(legalDocumentsService, 'update');
    const { onSaved } = setup(d);

    expect(screen.getByRole('dialog')).toHaveTextContent(L.editTitle);
    expect(label(F.docTitle)).toHaveValue(d.docTitle);
    expect(label(F.issueYear)).toHaveValue(String(d.issueYear));

    await user.clear(label(F.docTitle));
    await user.type(label(F.docTitle), 'Edited title');
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(d.id, { docTitle: 'Edited title' });
  });

  it('clearing an optional field PATCHes null', async () => {
    const user = userEvent.setup();
    const d = toLegalDocument(legalDocumentsMockDb.all().find((r) => r.purpose)!);
    const update = vi.spyOn(legalDocumentsService, 'update');
    const { onSaved } = setup(d);
    await user.clear(label(F.purpose));
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(d.id, { purpose: null });
  });
});
