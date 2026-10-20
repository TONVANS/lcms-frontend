import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterChips } from './filter-chips';

const options = [
  { value: 'all', label: 'ທັງໝົດ', count: 10 },
  { value: 'active', label: 'ມີຜົນບັງຄັບໃຊ້', count: 6 },
  { value: 'draft', label: 'ຮ່າງ', count: 4 },
];

describe('FilterChips', () => {
  it('renders all options with counts', () => {
    render(<FilterChips ariaLabel="ສະຖານະ" options={options} value="all" onChange={() => {}} />);
    expect(screen.getByText('ທັງໝົດ')).toBeInTheDocument();
    expect(screen.getByText('ມີຜົນບັງຄັບໃຊ້')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('marks selected chip with aria-pressed', () => {
    render(<FilterChips ariaLabel="ສະຖານະ" options={options} value="active" onChange={() => {}} />);
    const activeChip = screen.getByRole('button', { name: /ມີຜົນບັງຄັບໃຊ້/ });
    expect(activeChip).toHaveAttribute('aria-pressed', 'true');

    const allChip = screen.getByRole('button', { name: /ທັງໝົດ/ });
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('is a labelled group of toggle buttons', () => {
    render(<FilterChips ariaLabel="ສະຖານະ" options={options} value="all" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'ສະຖານະ' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('selected chip uses readable light text and accent in dark', () => {
    render(<FilterChips ariaLabel="x" options={options} value="all" onChange={() => {}} />);
    const cls = screen.getByRole('button', { name: /ທັງໝົດ/ }).className;
    expect(cls).toContain('text-(--text-strong)');
    expect(cls).toContain('dark:text-(--gold)');
  });

  it('triggers onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterChips ariaLabel="ສະຖານະ" options={options} value="all" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /ຮ່າງ/ }));
    expect(onChange).toHaveBeenCalledWith('draft');
  });
});
