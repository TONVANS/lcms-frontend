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
    render(<FilterChips options={options} value="all" onChange={() => {}} />);
    expect(screen.getByText('ທັງໝົດ')).toBeInTheDocument();
    expect(screen.getByText('ມີຜົນບັງຄັບໃຊ້')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('marks selected chip with aria-checked', () => {
    render(<FilterChips options={options} value="active" onChange={() => {}} />);
    const activeChip = screen.getByRole('radio', { name: /ມີຜົນບັງຄັບໃຊ້/ });
    expect(activeChip).toHaveAttribute('aria-checked', 'true');

    const allChip = screen.getByRole('radio', { name: /ທັງໝົດ/ });
    expect(allChip).toHaveAttribute('aria-checked', 'false');
  });

  it('triggers onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterChips options={options} value="all" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /ຮ່າງ/ }));
    expect(onChange).toHaveBeenCalledWith('draft');
  });
});
