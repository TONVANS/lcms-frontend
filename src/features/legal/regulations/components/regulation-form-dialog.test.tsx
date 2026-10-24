import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { documentsService } from '@/features/documents';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { regulationsService } from '../api/regulations.service';
import { regulationsMockDb } from '../mocks/regulations.mock';
import type { Regulation } from '../types';
import { RegulationFormDialog } from './regulation-form-dialog';

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

function setup(regulation?: Regulation) {
  const onSaved = vi.fn();
  const onOpenChange = vi.fn();
  const utils = render(
    <RegulationFormDialog open onOpenChange={onOpenChange} regulation={regulation} onSaved={onSaved} />,
  );
  return { onSaved, onOpenChange, ...utils };
}

const saveBtn = () =>
  screen.getByRole('button', { name: new RegExp(`^(${L.save}|${L.saving})$`) });
const label = (text: string) => screen.getByLabelText(new RegExp(text));

async function fillRequired(user: ReturnType<typeof userEvent.setup>, number = 'NEW-001/TEST') {
  await user.type(label(F.title), 'Test regulation');
  await user.type(label(F.number), number);
  await pickDate(user);
}

async function pickDate(user: ReturnType<typeof userEvent.setup>, dd = '15', month = new Date()) {
  await user.click(screen.getByRole('button', { name: new RegExp(F.issuedDate) }));
  const day = format(month, `'${dd}'/MM/yyyy`);
  await user.click(await screen.findByRole('button', { name: new RegExp(`(^|, )${day}`) }));
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  regulationsMockDb.reset(new Date());
  session('legal.editor');
});

describe('RegulationFormDialog', () => {
  it('create submits toRegulationPayload and calls onSaved', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(regulationsService, 'create');
    const { onSaved, onOpenChange } = setup();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: L.addLink }));
    await user.type(screen.getByLabelText(L.linkItem(1)), 'https://drive.google.com/x');
    await user.click(screen.getByRole('button', { name: L.addLink })); // blank row is ignored
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const sent = create.mock.calls[0]![0];
    expect(sent).toMatchObject({
      title: 'Test regulation',
      number: 'NEW-001/TEST',
      externalLinks: ['https://drive.google.com/x'],
      typeOther: null,
    });
    expect(sent.year).toBe(new Date().getFullYear());
    expect(onSaved.mock.calls[0]![0].number).toBe('NEW-001/TEST');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(L.saved);
  });

  it('edit prefills from the regulation and PATCHes', async () => {
    const user = userEvent.setup();
    const reg = regulationsMockDb.all()[0]!;
    const update = vi.spyOn(regulationsService, 'update');
    const { onSaved } = setup(reg);
    expect(label(F.title)).toHaveValue(reg.title);
    expect(label(F.number)).toHaveValue(reg.number);
    expect(screen.getByRole('dialog')).toHaveTextContent(L.editTitle);
    await user.type(label(F.title), ' EDITED');
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    // unchanged number saves (does not 409 against itself)
    expect(update).toHaveBeenCalledWith(reg.id, expect.objectContaining({ title: `${reg.title} EDITED` }));
  });

  it('409 maps lo.legal.validation.numberDuplicate onto the number field', async () => {
    const user = userEvent.setup();
    const [a, b] = regulationsMockDb.all();
    setup(a);
    const no = label(F.number);
    await user.clear(no);
    await user.type(no, b!.number);
    await user.click(saveBtn());
    await waitFor(() => expect(no).toHaveAttribute('aria-invalid', 'true'));
    expect(document.getElementById(no.getAttribute('aria-describedby') as string)).toHaveTextContent(
      lo.legal.validation.numberDuplicate,
    );
    expect(no).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('choosing type other reveals typeOther; switching back hides it and clears the error', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByLabelText(new RegExp(F.typeOther))).toBeNull();
    const pickType = async (name: string) => {
      await user.click(screen.getByRole('combobox', { name: new RegExp(F.type) }));
      await user.click(await screen.findByRole('option', { name }));
    };
    await pickType(lo.legal.regulationTypes.other);
    const other = label(F.typeOther);
    await user.click(saveBtn());
    await waitFor(() => expect(other).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText(lo.legal.validation.typeOtherRequired)).toBeInTheDocument();

    await pickType(lo.legal.regulationTypes.notice);
    expect(screen.queryByLabelText(new RegExp(F.typeOther))).toBeNull();
    expect(screen.queryByText(lo.legal.validation.typeOtherRequired)).toBeNull();
  });

  it('an over-long hidden typeOther cannot block submit after switching away from other', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(regulationsService, 'create');
    const { onSaved } = setup();
    await fillRequired(user, 'NEW-002/TEST');
    const pickType = async (name: string) => {
      await user.click(screen.getByRole('combobox', { name: new RegExp(F.type) }));
      await user.click(await screen.findByRole('option', { name }));
    };
    await pickType(lo.legal.regulationTypes.other);
    await user.click(label(F.typeOther));
    await user.paste('x'.repeat(101));
    await pickType(lo.legal.regulationTypes.notice);
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0]![0]).toMatchObject({ type: 'notice', typeOther: null });
  });

  it('picking issuedDate fills year; editing year stops the auto-fill', async () => {
    const user = userEvent.setup();
    setup();
    expect(label(F.year)).toHaveValue('');
    await pickDate(user);
    expect(label(F.year)).toHaveValue(String(new Date().getFullYear()));

    const year = label(F.year);
    await user.clear(year);
    await user.type(year, '2001');
    // a different day, so the picker really calls onChange
    await pickDate(user, '16');
    expect(screen.getByRole('button', { name: new RegExp(F.issuedDate) })).toHaveTextContent(
      format(new Date(), '16/MM/yyyy'),
    );
    expect(year).toHaveValue('2001');
  });

  it('edit: a stored year that differs from the issued date is not overwritten by a new date', async () => {
    const user = userEvent.setup();
    const reg = { ...regulationsMockDb.all()[0]!, issuedDate: '2020-03-10', year: 2015 };
    setup(reg);
    await pickDate(user, '15', new Date(2020, 2, 1)); // picker opens on the stored month
    expect(label(F.year)).toHaveValue('2015');
  });

  it('edit: a stored year equal to the issued date year follows a new date', async () => {
    const user = userEvent.setup();
    const reg = { ...regulationsMockDb.all()[0]!, issuedDate: '2020-03-10', year: 2020 };
    setup(reg);
    await user.click(screen.getByRole('button', { name: new RegExp(F.issuedDate) }));
    await user.selectOptions(await screen.findByRole('combobox', { name: lo.datePicker.year }), '2021');
    await user.click(await screen.findByRole('button', { name: /(^|, )15\/03\/2021/ }));
    expect(label(F.year)).toHaveValue('2021');
  });

  it('link rows can be removed with a Lao-labelled button', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: L.addLink }));
    await user.click(screen.getByRole('button', { name: L.addLink }));
    expect(screen.getByLabelText(L.linkItem(2))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: L.removeLink(1) }));
    expect(screen.queryByLabelText(L.linkItem(2))).toBeNull();
    expect(screen.getByLabelText(L.linkItem(1))).toBeInTheDocument();
  });

  it('rejects a non-https link on the row', async () => {
    const user = userEvent.setup();
    setup();
    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: L.addLink }));
    const row = screen.getByLabelText(L.linkItem(1));
    await user.type(row, 'http://evil.example');
    await user.click(saveBtn());
    await waitFor(() => expect(row).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText(lo.legal.validation.urlInvalid)).toBeInTheDocument();
    expect(row).toHaveFocus();
  });

  it('create with staged files uploads them as legal-regulation after create; a failed upload shows the partial-failure toast and still calls onSaved', async () => {
    const user = userEvent.setup();
    const upload = vi
      .spyOn(documentsService, 'upload')
      .mockImplementation((f) => (f.name === 'bad.pdf' ? Promise.reject(new Error('x')) : Promise.resolve({} as never)));
    const { onSaved } = setup();
    await fillRequired(user, 'NEW-003/TEST');
    const input = screen.getByLabelText(lo.dropzone.prompt);
    await user.upload(input, [
      new File(['a'], 'good.pdf', { type: 'application/pdf' }),
      new File(['b'], 'bad.pdf', { type: 'application/pdf' }),
    ]);
    await user.click(saveBtn());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const created = onSaved.mock.calls[0]![0] as Regulation;
    expect(upload).toHaveBeenCalledTimes(2);
    for (const call of upload.mock.calls) {
      expect(call[1]).toBe('legal-regulation');
      expect(call[2]).toBe(created.id);
    }
    expect(toast.error).toHaveBeenCalledWith(L.uploadFailed('bad.pdf'));
  });

  it('the dropzone is hidden in edit mode', () => {
    setup(regulationsMockDb.all()[0]);
    expect(screen.queryByLabelText(lo.dropzone.prompt)).toBeNull();
  });

  it('the dropzone is hidden without create permission', () => {
    session('legal.viewer');
    setup();
    expect(screen.queryByLabelText(lo.dropzone.prompt)).toBeNull();
  });

  it('closing returns focus to the trigger', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>open-trigger</button>
          <RegulationFormDialog open={open} onOpenChange={setOpen} onSaved={vi.fn()} />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'open-trigger' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: L.cancel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
