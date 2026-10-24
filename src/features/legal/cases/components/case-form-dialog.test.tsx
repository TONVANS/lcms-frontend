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
import { casesService } from '../api/cases.service';
import { casesMockDb } from '../mocks/cases.mock';
import type { LegalCase } from '../types';
import { CaseFormDialog } from './case-form-dialog';

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
  const utils = render(
    <CaseFormDialog
      open
      onOpenChange={onOpenChange}
      legalCase={legalCase}
      onSaved={onSaved}
    />,
  );
  return { onSaved, onOpenChange, ...utils };
}

const saveBtn = () =>
  screen.getByRole('button', { name: new RegExp(`^(${L.save}|${L.saving})$`) });
const label = (text: string) => screen.getByLabelText(new RegExp(text));

async function fillRequired(
  user: ReturnType<typeof userEvent.setup>,
  defendant = 'ທ້າວ ບຸນມີ',
) {
  await user.type(label(F.defendant), defendant);
  await user.type(label(F.allegation), 'ລັກສາຍໄຟຟ້າ');
  await user.type(label(F.handlingUnit), 'ສານປະຊາຊົນນະຄອນຫຼວງ');
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  installMocks(api, { delay: 0 });
  casesMockDb.reset(new Date());
  session('legal.editor');
});

describe('CaseFormDialog', () => {
  it('create submits payload and calls onSaved', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(casesService, 'create');
    const { onSaved, onOpenChange } = setup();

    expect(screen.getByRole('dialog')).toHaveTextContent(L.createTitle);
    await fillRequired(user);
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const sent = create.mock.calls[0]![0];
    expect(sent).toMatchObject({
      defendant: 'ທ້າວ ບຸນມີ',
      allegation: 'ລັກສາຍໄຟຟ້າ',
      handlingUnit: 'ສານປະຊາຊົນນະຄອນຫຼວງ',
      caseType: 'civil',
      stage: 'first_instance',
      disputeDate: null,
      progress: null,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).toHaveBeenCalledWith(L.saved);
  });

  it('edit prefills and PATCHes', async () => {
    const user = userEvent.setup();
    const c = casesMockDb.all()[0]!;
    const update = vi.spyOn(casesService, 'update');
    const { onSaved } = setup(c);

    expect(screen.getByRole('dialog')).toHaveTextContent(L.editTitle);
    expect(label(F.defendant)).toHaveValue(c.defendant);
    expect(label(F.allegation)).toHaveValue(c.allegation);
    expect(label(F.handlingUnit)).toHaveValue(c.handlingUnit);

    await user.clear(label(F.defendant));
    await user.type(label(F.defendant), 'ທ້າວ ສົມພອນ ໃໝ່');
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      c.id,
      expect.objectContaining({
        defendant: 'ທ້າວ ສົມພອນ ໃໝ່',
      }),
    );
  });

  it('typing 1,500,000 in damage LAK stores 1500000', async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(casesService, 'create');
    const { onSaved } = setup();

    await fillRequired(user);
    const damageLakInput = screen.getByLabelText(new RegExp(`${F.damage}.*LAK`));
    await user.type(damageLakInput, '1,500,000');
    await user.click(saveBtn());

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const sent = create.mock.calls[0]![0];
    expect(sent.damage.lak).toBe(1500000);
    expect(sent.damage.usd).toBeNull();
  });

  it("live total row shows caseTotal per currency, '—' when a side is null and '0' when entered as 0", async () => {
    const user = userEvent.setup();
    setup();

    const totalSection = screen.getByRole('region', { name: new RegExp(F.total) });
    expect(totalSection).toHaveTextContent('—');

    const damageLakInput = screen.getByLabelText(new RegExp(`${F.damage}.*LAK`));
    await user.type(damageLakInput, '0');
    expect(totalSection).toHaveTextContent('0');

    const fineUsdInput = screen.getByLabelText(new RegExp(`${F.fine}.*USD`));
    await user.type(fineUsdInput, '1000');
    expect(totalSection).toHaveTextContent('1,000');
  });

  it('caseNo is shown read-only in edit mode', () => {
    const c = casesMockDb.all()[0]!;
    const { unmount } = setup(c);
    expect(screen.getByText(c.caseNo)).toBeInTheDocument();
    unmount();

    setup(); // create mode
    expect(screen.queryByText(/^LC-\d{4}-\d{3}$/)).not.toBeInTheDocument();
  });
});
