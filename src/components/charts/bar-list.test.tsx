import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarList } from './bar-list';

const data = [
  { key: 'hydro', label: 'ພະລັງງານນ້ຳ', value: 1200, subValue: '75%' },
  { key: 'solar', label: 'ພະລັງງານແສງຕາເວັນ', value: 400, subValue: '25%' },
];

describe('BarList', () => {
  it('renders all bars with labels and values', () => {
    render(<BarList data={data} />);
    expect(screen.getByText('ພະລັງງານນ້ຳ')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('(75%)')).toBeInTheDocument();
    expect(screen.getByText('ພະລັງງານແສງຕາເວັນ')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });
});
