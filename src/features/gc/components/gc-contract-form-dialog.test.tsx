import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import type { ApiError } from '@/types/api';
import { gcService } from '../api/gc.service';
import { gcMockDb } from '../mocks/gc.mock';
import type { GeneralContract } from '../types';
import { GcContractFormDialog } from './gc-contract-form-dialog';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const F = lo.gc.fields;

function withValue(): GeneralContract {
  const c = gcMockDb.all().find((x) => x.value && x.endDate && x.equity === null && x.termText !== undefined);
  if (!c) throw new Error('seed has no contract with a value');
  return c;
}

function setup(contract?: GeneralContract) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  const utils = render(
    <GcContractFormDialog open onOpenChange={onOpenChange} contract={contract} onSaved={onSaved} />,
  );
  return { onSaved, onOpenChange, ...utils };
}

const saveBtn = () => screen.getByRole('button', { name: new RegExp(`^(${lo.gc.form.save}|${lo.gc.form.saving})$`) });

beforeEach(() => {
  installMocks(api, { delay: 0 });
  setMockSession('gc.editor', false);
  vi.restoreAllMocks();
});

describe('GcContractFormDialog', () => {
  it('shows Lao required errors linked to their fields and focuses the first invalid one', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(saveBtn());
    const title = screen.getByLabelText(new RegExp(F.title));
    const no = screen.getByLabelText(new RegExp(F.contractNo));
    await waitFor(() => expect(title).toHaveAttribute('aria-invalid', 'true'));
    expect(no).toHaveAttribute('aria-invalid', 'true');
    for (const input of [title, no]) {
      const errId = input.getAttribute('aria-describedby');
      expect(errId).toBeTruthy();
      expect(document.getElementById(errId as string)).toHaveTextContent(lo.gc.validation.required);
    }
    expect(title).toHaveFocus();
  });

  it('marks required fields: gold asterisk is hidden from AT and the control is aria-required', () => {
    setup();
    const title = screen.getByLabelText(new RegExp(F.title));
    expect(title).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(new RegExp(F.counterparty))).not.toHaveAttribute('aria-required');
    const star = document.getElementById('gc-field-title-label')?.querySelector('span');
    expect(star).toHaveAttribute('aria-hidden', 'true');
    expect(star).toHaveTextContent('*');
  });

  it('maps duplicate contractNo to the field', async () => {
    const user = userEvent.setup();
    const [a, b] = gcMockDb.all();
    setup(a);
    const no = screen.getByLabelText(new RegExp(F.contractNo));
    await user.clear(no);
    await user.type(no, b.contractNo);
    await user.click(saveBtn());
    await waitFor(() => expect(no).toHaveAttribute('aria-invalid', 'true'));
    const errId = no.getAttribute('aria-describedby') as string;
    expect(document.getElementById(errId)).toHaveTextContent(lo.gc.errors.duplicateNo);
    expect(no).toHaveFocus();
  });

  it('rejects end date before effective date, even beside another error', async () => {
    const user = userEvent.setup();
    const base = withValue();
    setup({ ...base, effectiveDate: '2026-05-01', endDate: '2026-04-01', signedDate: '2026-04-01' });
    await user.clear(screen.getByLabelText(new RegExp(F.title)));
    await user.click(saveBtn());
    const end = screen.getByLabelText(new RegExp(F.endDate));
    await waitFor(() => expect(end).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(end.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.gc.validation.endAfterEffective,
    );
    expect(screen.getByLabelText(new RegExp(F.title))).toHaveAttribute('aria-invalid', 'true');
  });

  it('announces required dates to assistive tech through the trigger name', () => {
    setup();
    const req = new RegExp(lo.common.required);
    expect(screen.getByRole('button', { name: new RegExp(`${F.effectiveDate}.*${lo.common.required}`) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`${F.signedDate}.*${lo.common.required}`) })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(F.endDate) })).not.toHaveAccessibleName(req);
  });

  it('offers a term suggestion and applies it', async () => {
    const user = userEvent.setup();
    setup({ ...withValue(), effectiveDate: '2026-01-01', endDate: '2031-01-01', termText: null });
    expect(screen.getByText(lo.gc.form.suggestTerm(lo.gc.term.years(5)))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.gc.form.useSuggestion }));
    expect(screen.getByLabelText(F.termText)).toHaveValue(lo.gc.term.years(5));
    expect(screen.queryByText(lo.gc.form.suggestTerm(lo.gc.term.years(5)))).not.toBeInTheDocument();
  });

  it('edit prefills and saving with a cleared value sends null', async () => {
    const user = userEvent.setup();
    const c = withValue();
    const spy = vi.spyOn(gcService, 'update');
    const { onSaved, onOpenChange } = setup(c);
    expect(screen.getByLabelText(new RegExp(F.title))).toHaveValue(c.title);
    await user.clear(screen.getByLabelText(F.value));
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][0]).toBe(c.id);
    expect(spy.mock.calls[0][1]).toMatchObject({ value: null });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks a double submit, ignores close while saving, and calls onSaved once', async () => {
    const user = userEvent.setup();
    const c = withValue();
    let resolve!: (v: GeneralContract) => void;
    const spy = vi.spyOn(gcService, 'update').mockReturnValue(new Promise((r) => (resolve = r)));
    const { onSaved, onOpenChange } = setup(c);
    const btn = saveBtn();
    await user.click(btn);
    await waitFor(() => expect(saveBtn()).toBeDisabled());
    expect(saveBtn()).toHaveTextContent(lo.gc.form.saving);
    await user.click(saveBtn());
    await user.keyboard('{Escape}');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    resolve(c);
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows other server field errors on their field', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 409, code: 'X', message: '', fieldErrors: { counterparty: 'ຄູ່ສັນຍານີ້ບໍ່ຖືກຕ້ອງ' } };
    vi.spyOn(gcService, 'update').mockRejectedValue(err);
    setup(withValue());
    await user.click(saveBtn());
    const field = screen.getByLabelText(F.counterparty);
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(field.getAttribute('aria-describedby') as string)).toHaveTextContent(
      'ຄູ່ສັນຍານີ້ບໍ່ຖືກຕ້ອງ',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an inline rose banner for other failures and re-enables Save', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 500, code: 'HTTP_500', message: '' };
    vi.spyOn(gcService, 'update').mockRejectedValue(err);
    const { onSaved } = setup(withValue());
    await user.click(saveBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.server);
    expect(saveBtn()).toBeEnabled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('equity: percent validates range, none clears it', async () => {
    const user = userEvent.setup();
    const c = withValue();
    const spy = vi.spyOn(gcService, 'update');
    setup(c);
    await user.click(screen.getByRole('radio', { name: lo.gc.equityKind.percent }));
    const pct = screen.getByLabelText(lo.gc.form.percentInput, { exact: false });
    await user.type(pct, '150');
    await user.click(saveBtn());
    await waitFor(() => expect(pct).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(pct.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.gc.validation.percentRange,
    );
    expect(pct).toHaveFocus();
    await user.clear(pct);
    await user.type(pct, '25');
    await user.click(saveBtn());
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][1]).toMatchObject({ equity: { kind: 'percent', percent: 25 } });
  });

  it('equity none sends null', async () => {
    const user = userEvent.setup();
    const c = { ...withValue(), equity: { kind: 'percent', percent: 10 } as const };
    const spy = vi.spyOn(gcService, 'update');
    setup(c);
    await user.click(screen.getByRole('radio', { name: lo.gc.form.equityNone }));
    await user.click(saveBtn());
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(spy.mock.calls[0][1]).toMatchObject({ equity: null });
  });

  it('resets to the new contract, or to empty for create, when reopened', async () => {
    const user = userEvent.setup();
    const [a, b] = gcMockDb.all();
    const props = { onOpenChange: vi.fn(), onSaved: vi.fn() };
    const { rerender } = render(<GcContractFormDialog open contract={a} {...props} />);
    const title = () => screen.getByLabelText(new RegExp(F.title));
    expect(title()).toHaveValue(a.title);
    await user.type(title(), ' EDITED');

    rerender(<GcContractFormDialog open={false} contract={a} {...props} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<GcContractFormDialog open contract={b} {...props} />);
    expect(title()).toHaveValue(b.title);
    expect(screen.getByLabelText(new RegExp(F.contractNo))).toHaveValue(b.contractNo);

    rerender(<GcContractFormDialog open={false} contract={b} {...props} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    rerender(<GcContractFormDialog open {...props} />);
    expect(screen.getByRole('dialog')).toHaveTextContent(lo.gc.form.createTitle);
    expect(title()).toHaveValue('');
    expect(screen.getByLabelText(new RegExp(F.contractNo))).toHaveValue('');
    expect(screen.getByLabelText(F.value)).toHaveValue('');
    expect(screen.getByRole('radio', { name: lo.gc.form.equityNone })).toBeChecked();
  });

  it('resets when switching directly between contracts while open', () => {
    const [a, b] = gcMockDb.all();
    const props = { onOpenChange: vi.fn(), onSaved: vi.fn() };
    const { rerender } = render(<GcContractFormDialog open contract={a} {...props} />);
    rerender(<GcContractFormDialog open contract={b} {...props} />);
    expect(screen.getByLabelText(new RegExp(F.title))).toHaveValue(b.title);
  });

  it('server equity error moves focus to the equity group and shows the message', async () => {
    const user = userEvent.setup();
    const err: ApiError = { status: 409, code: 'X', message: '', fieldErrors: { equity: 'ສັດສ່ວນບໍ່ຖືກຕ້ອງ' } };
    vi.spyOn(gcService, 'update').mockRejectedValue(err);
    setup(withValue());
    await user.click(saveBtn());
    const radio = screen.getByRole('radio', { name: lo.gc.form.equityNone });
    await waitFor(() => expect(radio).toHaveFocus());
    expect(screen.getByText('ສັດສ່ວນບໍ່ຖືກຕ້ອງ')).toBeInTheDocument();
  });

  it('shows the banner too when a server key matches no field', async () => {
    const user = userEvent.setup();
    const err: ApiError = {
      status: 409,
      code: 'X',
      message: '',
      fieldErrors: { counterparty: 'ຄູ່ສັນຍານີ້ບໍ່ຖືກຕ້ອງ', documents: 'bad' },
    };
    vi.spyOn(gcService, 'update').mockRejectedValue(err);
    setup(withValue());
    await user.click(saveBtn());
    expect(await screen.findByRole('alert')).toHaveTextContent(lo.errors.unknown);
    expect(screen.getByLabelText(F.counterparty)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(F.counterparty)).toHaveFocus();
  });

  it('hides the close button while saving', async () => {
    const user = userEvent.setup();
    const c = withValue();
    let resolve!: (v: GeneralContract) => void;
    vi.spyOn(gcService, 'update').mockReturnValue(new Promise((r) => (resolve = r)));
    setup(c);
    expect(screen.getByRole('button', { name: lo.common.close })).toBeInTheDocument();
    await user.click(saveBtn());
    await waitFor(() => expect(screen.queryByRole('button', { name: lo.common.close })).not.toBeInTheDocument());
    resolve(c);
    await waitFor(() => expect(screen.queryByRole('button', { name: lo.common.close })).toBeInTheDocument());
  });

  it('marks percent and amount sub-fields required', async () => {
    const user = userEvent.setup();
    setup(withValue());
    await user.click(screen.getByRole('radio', { name: lo.gc.equityKind.percent }));
    const pct = screen.getByLabelText(lo.gc.form.percentInput, { exact: false });
    expect(pct).toHaveAttribute('aria-required', 'true');
    expect(document.getElementById('gc-field-equity-percent-label')?.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('radio', { name: lo.gc.equityKind.amount }));
    expect(screen.getByLabelText(new RegExp(lo.money.amount, 'g'), { selector: '#gc-field-equity-amount' })).toHaveAttribute('aria-required', 'true');
  });

  it('parent closing mid-save: onSaved once, no toast, no onOpenChange', async () => {
    const c = withValue();
    let resolve!: (v: GeneralContract) => void;
    vi.spyOn(gcService, 'update').mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    const props = { onOpenChange: vi.fn(), onSaved: vi.fn() };
    const { rerender } = render(<GcContractFormDialog open contract={c} {...props} />);
    await user.click(saveBtn());
    await waitFor(() => expect(saveBtn()).toBeDisabled());
    rerender(<GcContractFormDialog open={false} contract={c} {...props} />);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    resolve(c);
    await waitFor(() => expect(props.onSaved).toHaveBeenCalledTimes(1));
    expect(toast.success).not.toHaveBeenCalled();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
});
