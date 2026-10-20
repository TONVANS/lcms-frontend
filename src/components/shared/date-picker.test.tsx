import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './date-picker';
import { lo } from '@/lib/i18n/lo';

function Harness({ initial, onSpy, clearable }: { initial: string | null; onSpy: (v: string | null) => void; clearable?: boolean }) {
  const [v, setV] = useState<string | null>(initial);
  return (
    <DatePicker
      id="d"
      value={v}
      clearable={clearable}
      onChange={(x) => {
        onSpy(x);
        setV(x);
      }}
    />
  );
}

describe('DatePicker', () => {
  it('emits local YYYY-MM-DD and shows dd/mm/yyyy', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-03-01" onSpy={onChange} />);
    await user.click(screen.getByRole('button', { name: /01\/03\/2026/ }));
    const dialog = await screen.findByRole('dialog');
    const day = within(dialog)
      .getAllByRole('button')
      .find((b) => b.textContent === '5' && !b.hasAttribute('disabled'))!;
    await user.click(day);
    expect(onChange).toHaveBeenLastCalledWith('2026-03-05');
    expect(screen.getByRole('button', { name: /05\/03\/2026/ })).toBeInTheDocument();
  });

  it('shows placeholder when empty', () => {
    render(<DatePicker id="d" value={null} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: lo.datePicker.placeholder })).toBeInTheDocument();
  });

  it('shows Lao weekdays Monday-first', async () => {
    const user = userEvent.setup();
    render(<DatePicker id="d" value="2026-03-01" onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /01\/03\/2026/ }));
    const headers = await screen.findAllByRole('columnheader', { hidden: true });
    expect(headers[0]).toHaveTextContent('ຈ');
    expect(headers[6]).toHaveTextContent('ອາ');
  });

  it('clear emits null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial="2026-03-01" onSpy={onChange} clearable />);
    await user.click(screen.getByRole('button', { name: lo.datePicker.clear }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
