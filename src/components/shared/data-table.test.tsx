import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { DataTable, type DataTableColumn } from './data-table';

interface TestItem {
  id: string;
  name: string;
  status: string;
}

const columns: DataTableColumn<TestItem>[] = [
  { id: 'name', header: 'ຊື່', cell: (r) => r.name, sortable: true },
  { id: 'status', header: 'ສະຖານະ', cell: (r) => r.status },
];

const mockData: TestItem[] = [
  { id: '1', name: 'ໂຄງການ 1', status: 'active' },
  { id: '2', name: 'ໂຄງການ 2', status: 'draft' },
];

const base = {
  caption: 'c',
  getRowId: (r: TestItem) => r.id,
  columns,
  data: mockData,
  total: 2,
  page: 1,
  pageSize: 10,
  onPageChange: () => {},
  emptyTitle: 'e',
};

describe('DataTable', () => {
  it('renders headers, rows and caption', () => {
    render(<DataTable {...base} />);
    expect(screen.getByText('ຊື່')).toBeInTheDocument();
    expect(screen.getByText('ໂຄງການ 2')).toBeInTheDocument();
    expect(screen.getByText('c')).toHaveClass('sr-only');
  });

  it('renders empty state when data is empty', () => {
    render(<DataTable {...base} data={[]} total={0} emptyTitle="ບໍ່ມີຂໍ້ມູນ" />);
    expect(screen.getByText('ບໍ່ມີຂໍ້ມູນ')).toBeInTheDocument();
  });

  it('renders owned columns and sorts via aria-sort header', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <DataTable
        {...base}
        data={[{ id: '1', name: 'A', status: 's' }]}
        total={1}
        sort={{ id: 'name', order: 'asc' }}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /ຊື່/ })).toHaveAttribute('aria-sort', 'ascending');
    await user.click(screen.getByRole('button', { name: /ຊື່/ }));
    expect(onSortChange).toHaveBeenCalledWith({ id: 'name', order: 'desc' });
  });

  it('toggles desc back to asc and leaves non-sortable headers without a button', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<DataTable {...base} sort={{ id: 'name', order: 'desc' }} onSortChange={onSortChange} />);
    expect(screen.getByRole('columnheader', { name: /ຊື່/ })).toHaveAttribute('aria-sort', 'descending');
    await user.click(screen.getByRole('button', { name: /ຊື່/ }));
    expect(onSortChange).toHaveBeenCalledWith({ id: 'name', order: 'asc' });
    expect(within(screen.getByRole('columnheader', { name: 'ສະຖານະ' })).queryByRole('button')).toBeNull();
  });

  it('shows range and total in the footer', () => {
    render(<DataTable {...base} total={25} page={2} pageSize={10} />);
    expect(screen.getByText(lo.common.showing('11–20', 25))).toBeInTheDocument();
  });

  it('pagination buttons meet 44px and are labelled', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<DataTable {...base} total={25} page={2} onPageChange={onPageChange} />);
    const next = screen.getByRole('button', { name: lo.table.next });
    expect(next).toHaveClass('size-11');
    expect(screen.getByRole('button', { name: lo.table.prev })).toHaveClass('size-11');
    await user.click(next);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('does not import legacy TanStack APIs', () => {
    const src = readFileSync('src/components/shared/data-table.tsx', 'utf8');
    expect(src).not.toMatch(/Legacy/);
  });

  it('sort button carries the mandated focus ring classes', () => {
    render(<DataTable {...base} sort={{ id: 'name', order: 'asc' }} onSortChange={() => {}} />);
    const btn = screen.getByRole('button', { name: /ຊື່/ });
    for (const c of [
      'focus-visible:outline-solid',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-(--focus-ring)',
    ]) {
      expect(btn).toHaveClass(c);
    }
    expect(btn).not.toHaveClass('outline-none');
  });

  it('omits aria-sort when onSortChange is absent', () => {
    render(<DataTable {...base} />);
    expect(screen.getByRole('columnheader', { name: /ຊື່/ })).not.toHaveAttribute('aria-sort');
  });

  it('clamps the footer range when page is past the data', () => {
    render(<DataTable {...base} total={25} page={4} pageSize={10} />);
    expect(screen.getByText(lo.common.showing(25, 25))).toBeInTheDocument();
  });

  it('stops staggering after the gate without remounting rows', () => {
    vi.useFakeTimers();
    try {
      render(<DataTable {...base} />);
      const row = screen.getByText('ໂຄງການ 1').closest('tr')!;
      expect(row).toHaveClass('animate-fade-in-up-sm');
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      const after = screen.getByText('ໂຄງການ 1').closest('tr')!;
      expect(after).toBe(row);
      expect(after.className).not.toMatch(/animate-/);
    } finally {
      vi.useRealTimers();
    }
  });
});
