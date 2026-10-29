import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { clearMockSession, setMockSession } from '@/lib/auth/session';
import { lo } from '@/lib/i18n/lo';
import { emptyPowerForm, powerContractSchema, type PowerFormValues } from '../schemas/ppa.schema';
import { PpaFormFieldGroup, projectTypeIssue } from './ppa-contract-form-fields';

function Harness({ initial }: { initial?: Partial<PowerFormValues> }) {
  const form = useForm<PowerFormValues>({
    resolver: zodResolver(powerContractSchema),
    defaultValues: { ...emptyPowerForm(), ...initial },
  });
  return <PpaFormFieldGroup group="general" form={form} />;
}

beforeEach(() => {
  installMocks(api, { delay: 0 });
  clearMockSession();
  setMockSession('ppa.user', false);
});

describe('conditional projectTypeOrCustomer field', () => {
  it('PURCHASE renders a select of project types', async () => {
    render(<Harness />);
    expect(await screen.findByRole('combobox', { name: new RegExp(lo.ppa.fields.projectType) })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) })).not.toBeInTheDocument();
  });

  it('SALE renders a free text input', async () => {
    render(<Harness initial={{ contractType: 'SALE' }} />);
    expect(await screen.findByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: new RegExp(lo.ppa.fields.projectType) })).not.toBeInTheDocument();
  });

  it('switching the type clears the field', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ contractType: 'SALE', projectTypeOrCustomer: 'Acme' }} />);
    const input = await screen.findByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) });
    expect(input).toHaveValue('Acme');
    await user.click(screen.getByRole('radio', { name: lo.ppa.types.PURCHASE }));
    await screen.findByRole('combobox', { name: new RegExp(lo.ppa.fields.projectType) });
    await user.click(screen.getByRole('radio', { name: lo.ppa.types.SALE }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: new RegExp(lo.ppa.fields.customer) })).toHaveValue(''),
    );
  });
});

describe('projectTypeIssue', () => {
  const types = ['A', 'B'];
  const base = { ...emptyPowerForm(), projectTypeOrCustomer: 'Z' };
  it('flags a PURCHASE value outside the loaded list', () => {
    expect(projectTypeIssue({ ...base, contractType: 'PURCHASE' }, types, true, '')).toBe(
      lo.ppa.validation.projectTypeNotInList,
    );
  });
  it('accepts values in the list, SALE, unloaded lists and an unchanged legacy value', () => {
    expect(projectTypeIssue({ ...base, projectTypeOrCustomer: 'A' }, types, true, '')).toBeNull();
    expect(projectTypeIssue({ ...base, contractType: 'SALE' }, types, true, '')).toBeNull();
    expect(projectTypeIssue(base, types, false, '')).toBeNull();
    expect(projectTypeIssue(base, types, true, 'Z')).toBeNull();
  });
});
