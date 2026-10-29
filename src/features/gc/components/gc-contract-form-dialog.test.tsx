import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLookupsStore } from '@/features/lookups';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { gcService } from '../api/gc.service';
import { toContract } from '../lib/contract-mapper';
import { gcMockDb } from '../mocks/gc.mock';
import type { Contract } from '../types';
import { GcContractFormDialog } from './gc-contract-form-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const F = lo.gc.fields;
const first = (): Contract => toContract(gcMockDb.all()[0]);

function setup(contract?: Contract) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  render(<GcContractFormDialog open onOpenChange={onOpenChange} contract={contract} onSaved={onSaved} />);
  return { onSaved, onOpenChange };
}

const saveBtn = () =>
  screen.getByRole('button', { name: new RegExp(`^(${lo.gc.form.save}|${lo.gc.form.saving})$`) });
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (text: string) => screen.getByLabelText(new RegExp(esc(text)));

beforeEach(() => {
  vi.restoreAllMocks();
  installMocks(api, { delay: 0 });
  setMockSession('gc.editor', false);
  gcMockDb.reset(new Date());
  useLookupsStore.getState().reset();
});

describe('GcContractFormDialog', () => {
  it('shows Lao required errors for the three required fields and focuses the first', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(saveBtn());
    await waitFor(() => expect(label(F.title)).toHaveAttribute('aria-invalid', 'true'));
    expect(label(F.contractNumber)).toHaveAttribute('aria-invalid', 'true');
    const typeTrigger = screen.getByRole('combobox', { name: new RegExp(F.contractTypeId) });
    expect(typeTrigger).toHaveAttribute('aria-invalid', 'true');
    const errId = label(F.title).getAttribute('aria-describedby') as string;
    expect(document.getElementById(errId)).toHaveTextContent(lo.gc.validation.required);
    expect(label(F.title)).toHaveFocus();
  });

  it('marks required fields as aria-required', () => {
    setup();
    expect(label(F.title)).toHaveAttribute('aria-required', 'true');
    expect(label(F.implementer)).not.toHaveAttribute('aria-required');
  });

  it('create submits a trimmed payload with the chosen type, number value and default notify days', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(gcService, 'create');
    const { onSaved, onOpenChange } = setup();
    await user.type(label(F.title), '  New deal ');
    await user.type(label(F.contractNumber), 'ZZ-1');
    await user.click(screen.getByRole('combobox', { name: new RegExp(F.contractTypeId) }));
    await user.click(await screen.findByRole('option', { name: lo.gc.types.land_lease }));
    await user.type(label(F.durationMonths), '24');
    await user.type(label(F.sharePercentage), '51.5');
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith({
      title: 'New deal',
      contractTypeId: 3,
      contractNumber: 'ZZ-1',
      durationMonths: 24,
      sharePercentage: 51.5,
      notifyDaysBefore: 60,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('edit prefills and PATCHes only the changed fields', async () => {
    const user = userEvent.setup();
    const c = first();
    const spy = vi.spyOn(gcService, 'update');
    const { onSaved } = setup(c);
    expect(label(F.title)).toHaveValue(c.title);
    await user.clear(label(F.implementer));
    await user.type(label(F.implementer), 'ຝ່າຍໃໝ່');
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(spy).toHaveBeenCalledWith(c.id, { implementer: 'ຝ່າຍໃໝ່' });
  });

  it('maps a 409 to the contract number field', async () => {
    const user = userEvent.setup();
    const [a, b] = gcMockDb.all();
    setup(toContract(a));
    const no = label(F.contractNumber);
    await user.clear(no);
    await user.type(no, b.contractNumber);
    await user.click(saveBtn());
    await waitFor(() => expect(no).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(no.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.gc.errors.duplicateNo,
    );
  });

  it('maps Nest 400 lines to fields and shows the rest in a banner', async () => {
    const user = userEvent.setup();
    vi.spyOn(gcService, 'update').mockRejectedValue({
      status: 400,
      code: 'HTTP_400',
      message: 'implementer must be shorter than 200\nsomething else broke',
    });
    setup(first());
    await user.type(label(F.implementer), 'x');
    await user.click(saveBtn());
    await waitFor(() => expect(label(F.implementer)).toHaveAttribute('aria-invalid', 'true'));
    expect(
      document.getElementById(label(F.implementer).getAttribute('aria-describedby') as string),
    ).toHaveTextContent('implementer must be shorter than 200');
    expect(screen.getByText(/something else broke/)).toBeInTheDocument();
  });

  it('rejects expiration before effective date', async () => {
    const user = userEvent.setup();
    setup({ ...first(), effectiveDate: '2026-05-01', expirationDate: '2026-04-01' });
    await user.click(saveBtn());
    const exp = screen.getByRole('button', { name: new RegExp(F.expirationDate) });
    await waitFor(() => expect(exp).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText(lo.gc.validation.endAfterEffective)).toBeInTheDocument();
  });
});
