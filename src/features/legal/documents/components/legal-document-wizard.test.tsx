import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { MOCK_DEPARTMENTS } from '@/features/lookups/mocks/lookups.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { legalDocumentsService } from '../api/legal-documents.service';
import { legalDocumentsMockDb } from '../mocks/legal-documents.mock';
import { LegalDocumentWizard } from './legal-document-wizard';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => '/legal/new',
  useSearchParams: () => new URLSearchParams('kind=regulation'),
}));

const F = lo.legal.fields;
const W = lo.legal.wizard;
const WR = W.regulations;
const label = (t: string) => screen.getByLabelText(new RegExp(t));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  legalDocumentsMockDb.reset(new Date());
  setMockSession('legal.editor', false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === 'legal.editor')!, status: 'authenticated' });
});

describe('LegalDocumentWizard', () => {
  it('blocks step 1 until the required fields are valid', async () => {
    const user = userEvent.setup();
    render(<LegalDocumentWizard />);
    await user.click(screen.getByRole('button', { name: W.next }));
    expect((await screen.findAllByText(lo.legal.validation.required)).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 2, name: WR.step1 })).toBeInTheDocument();
  });

  it('walks three steps, shows the review and creates the document', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(legalDocumentsService, 'create');
    render(<LegalDocumentWizard />);

    expect(screen.getByRole('heading', { level: 1, name: WR.title })).toBeInTheDocument();
    await user.type(label(F.docTitle), 'Wizard doc');
    await user.type(label(F.docNumberDate), 'No 77');
    await user.click(screen.getByRole('button', { name: W.next }));

    expect(await screen.findByRole('heading', { level: 2, name: WR.step2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: W.next }));
    expect((await screen.findAllByText(lo.legal.validation.required)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('combobox', { name: new RegExp(F.department) }));
    await user.click(await screen.findByRole('option', { name: MOCK_DEPARTMENTS[0].name }));
    await user.click(screen.getByRole('button', { name: W.next }));

    expect(await screen.findByRole('heading', { level: 2, name: WR.step3 })).toBeInTheDocument();
    expect(screen.getAllByText('Wizard doc').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: WR.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).toMatchObject({
      docTitle: 'Wizard doc',
      docNumberDate: 'No 77',
      departmentId: MOCK_DEPARTMENTS[0].id,
    });
    const created = await create.mock.results[0].value;
    expect(push).toHaveBeenCalledWith('/legal/regulations/' + created.id);
  });
});
