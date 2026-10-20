import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoneyInput } from './money-input';

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
});
