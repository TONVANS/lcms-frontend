import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { DataTable, type ColumnDef } from './data-table';

interface TestItem {
  id: string;
  name: string;
  status: string;
}

const columns: ColumnDef<TestItem>[] = [
  {
    accessorKey: 'name',
    header: 'ຊື່',
  },
  {
    accessorKey: 'status',
    header: 'ສະຖານະ',
  },
];

const mockData: TestItem[] = [
  { id: '1', name: 'ໂຄງການ 1', status: 'active' },
  { id: '2', name: 'ໂຄງການ 2', status: 'draft' },
];

describe('DataTable', () => {
  it('renders table headers and rows', () => {
    render(<DataTable columns={columns} data={mockData} />);
    expect(screen.getByText('ຊື່')).toBeInTheDocument();
    expect(screen.getByText('ສະຖານະ')).toBeInTheDocument();
    expect(screen.getByText('ໂຄງການ 1')).toBeInTheDocument();
    expect(screen.getByText('ໂຄງການ 2')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="ບໍ່ມີຂໍ້ມູນ" />);
    expect(screen.getByText('ບໍ່ມີຂໍ້ມູນ')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination buttons are clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        total={20}
        page={1}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: lo.table.next });
    await user.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
