import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Timeline } from './timeline';

const items = [
  { id: '1', date: '2026-01-10', title: 'ເຊັນສັນຍາ MOU', description: 'ເລີ່ມຕົ້ນໂຄງການ' },
  { id: '2', date: '2026-06-15', title: 'ສັນຍາສຳປະທານ (CA)', status: 'current' as const },
  { id: '3', date: '2027-01-01', title: 'ກຳນົດ COD', status: 'future' as const },
];

describe('Timeline', () => {
  it('renders timeline items with formatted dates and titles', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText('10/01/2026')).toBeInTheDocument();
    expect(screen.getByText('ເຊັນສັນຍາ MOU')).toBeInTheDocument();
    expect(screen.getByText('ເລີ່ມຕົ້ນໂຄງການ')).toBeInTheDocument();
    expect(screen.getByText('ສັນຍາສຳປະທານ (CA)')).toBeInTheDocument();
    expect(screen.getByText('01/01/2027')).toBeInTheDocument();
  });
});
