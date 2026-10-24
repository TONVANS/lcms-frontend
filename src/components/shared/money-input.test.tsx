import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoneyInput } from './money-input';
import type { Money } from '@/types/domain';
import { lo } from '@/lib/i18n/lo';

describe('MoneyInput', () => {
  it('parses grouped input and keeps currency', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoneyInput id="v" value={null} onChange={onChange} currencies={['LAK', 'USD', 'CNY']} />);
    await user.type(screen.getByRole('textbox'), '1,200,000.5');
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1200000.5, currency: 'LAK' });
  });

  it('empty amount emits null and formats on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoneyInput id="v" value={{ amount: 1200000, currency: 'USD' }} onChange={onChange} currencies={['LAK', 'USD']} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('1,200,000');
    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('offers only the given currencies with Lao labels', async () => {
    const user = userEvent.setup();
    render(<MoneyInput id="v" value={null} onChange={() => {}} currencies={['LAK', 'USD', 'CNY']} />);
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'ກີບ' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'USD' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ຢວນ' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ບາດ' })).not.toBeInTheDocument();
  });

  it.each(['-5', '0x10', '1e3', 'abc'])('rejects %s as null', async (txt) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoneyInput id="v" value={null} onChange={onChange} currencies={['LAK']} />);
    await user.type(screen.getByRole('textbox'), txt);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('formats on blur', async () => {
    const user = userEvent.setup();
    render(<MoneyInput id="v" value={null} onChange={() => {}} currencies={['LAK']} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '1200000');
    expect(input).toHaveValue('1200000');
    await user.tab();
    expect(input).toHaveValue('1,200,000');
  });

  it('keeps currency after clearing when the value prop is unchanged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoneyInput id="v" value={{ amount: 1, currency: 'USD' }} onChange={onChange} currencies={['LAK', 'USD']} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '500');
    expect(onChange).toHaveBeenLastCalledWith({ amount: 500, currency: 'USD' });
  });

  it('keeps the currency when a controlled parent feeds null back', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState<Money | null>({ amount: 100, currency: 'USD' });
      return (
        <MoneyInput
          id="v"
          value={v}
          onChange={(x) => {
            onChange(x);
            setV(x);
          }}
          currencies={['LAK', 'USD']}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '500');
    expect(onChange).toHaveBeenLastCalledWith({ amount: 500, currency: 'USD' });
  });

  it('with one currency it renders a static currency label and no combobox', () => {
    render(<MoneyInput id="v" value={null} onChange={() => {}} currencies={['LAK']} />);
    expect(screen.getByText(lo.currency.LAK)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('with several currencies it still renders the select', () => {
    render(<MoneyInput id="v" value={null} onChange={() => {}} currencies={['LAK', 'USD']} />);
    expect(screen.getByRole('combobox', { name: lo.money.currency })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAccessibleName(lo.money.amount);
  });
});
