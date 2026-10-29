import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { useLookupsStore } from '@/features/lookups';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { gcService } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import { GcWizardView } from './gc-wizard-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => '/contracts/new',
  useSearchParams: () => new URLSearchParams(),
}));

const F = lo.gc.fields;
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (text: string) => screen.getByLabelText(new RegExp(esc(text)));

beforeEach(() => {
  vi.restoreAllMocks();
  nav.replace = vi.fn();
  installMocks(api, { delay: 0 });
  setMockSession('gc.user', false);
  useAuthStore.setState({ user: MOCK_USERS.find((u) => u.username === 'gc.user')!, status: 'authenticated' });
  gcMockDb.reset(new Date());
  useLookupsStore.getState().reset();
});

describe('GcWizardView', () => {
  it('blocks step 1 until the required fields are filled', async () => {
    const user = userEvent.setup();
    render(<GcWizardView />);
    await user.click(screen.getByRole('button', { name: lo.gc.wizard.next }));
    await waitFor(() => expect(label(F.title)).toHaveAttribute('aria-invalid', 'true'));
    expect(label(F.title)).toHaveFocus();
  });

  it('walks four steps, reviews and creates with the shared payload mapper', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(gcService, 'create');
    render(<GcWizardView />);
    await user.type(label(F.title), 'Wizard deal');
    await user.type(label(F.contractNumber), 'WZ-1');
    await user.click(screen.getByRole('combobox', { name: new RegExp(F.contractTypeId) }));
    await user.click(await screen.findByRole('option', { name: lo.gc.types.moa }));
    const next = () => user.click(screen.getByRole('button', { name: lo.gc.wizard.next }));
    await next();
    await user.type(await screen.findByLabelText(F.durationText), '2 ປີ');
    await next();
    await user.type(await screen.findByLabelText(F.sharePercentage), '10');
    await next();
    expect(await screen.findByText(lo.gc.wizard.review)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.gc.wizard.submit }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      title: 'Wizard deal',
      contractTypeId: 13,
      contractNumber: 'WZ-1',
      durationText: '2 ປີ',
      sharePercentage: 10,
      notifyDaysBefore: 60,
    });
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/contracts\/gc-/)));
  });
});
