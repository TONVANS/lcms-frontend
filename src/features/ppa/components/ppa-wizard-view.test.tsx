import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { powerMockDb } from '../mocks/ppa.mock';
import { PpaWizardView } from './ppa-wizard-view';

const replace = vi.fn();
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ppa/new',
}));

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  setMockSession('ppa.user', false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === 'ppa.user')!, status: 'authenticated' });
  powerMockDb.reset();
  replace.mockClear();
});

describe('PpaWizardView', () => {
  it('renders the first step with the live summary', () => {
    render(<PpaWizardView />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(lo.ppa.wizard.title);
    expect(screen.getByText(lo.ppa.wizard.summary)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: lo.ppa.types.PURCHASE })).toBeChecked();
  });

  it('blocks Next while required fields are empty', async () => {
    const user = userEvent.setup();
    render(<PpaWizardView />);
    await user.click(screen.getByRole('button', { name: lo.ppa.wizard.next }));
    expect(await screen.findByText(lo.ppa.validation.projectNameRequired)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: lo.ppa.wizard.step1 })).toBeInTheDocument();
  });

  it('walks all steps for a SALE contract and creates it', async () => {
    const user = userEvent.setup();
    render(<PpaWizardView />);
    await user.click(screen.getByRole('radio', { name: lo.ppa.types.SALE }));
    await user.type(screen.getByRole('textbox', { name: new RegExp(lo.ppa.fields.projectName) }), 'Wizard project');
    await user.type(screen.getByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) }), 'Wizard customer');
    await user.type(screen.getByRole('textbox', { name: new RegExp(lo.ppa.fields.contractNumber) }), 'WZ-1');
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: lo.ppa.wizard.next }));
    expect(await screen.findByRole('heading', { level: 2, name: lo.ppa.wizard.step4 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.ppa.wizard.submit }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(replace.mock.calls[0][0]).toMatch(/^\/ppa\/contracts\/ppa-new-/);
    expect(powerMockDb.all().some((r) => r.contractNumber === 'WZ-1')).toBe(true);
  });
});
