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

describe('BarList motion and tokens', () => {
  it('fill has no width transition and uses grow-x', () => {
    render(<BarList data={[{ key: 'a', label: 'A', value: 5 }]} accent="gc" />);
    const fill = screen.getByTestId('bar-fill-a');
    expect(fill.className).not.toMatch(/transition-(all|\[width)/);
    expect(fill.className).not.toContain('transition');
    expect(fill.parentElement!.className).toContain('animate-grow-x');
    expect(fill.parentElement!.className).toContain('origin-left');
    expect(fill.className).toContain('from-(--series-gc-from)');
    expect(fill.className).toContain('to-(--series-gc-to)');
    expect(fill.className).toContain('rounded-[4px]');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('supports the litigation accent', () => {
    render(<BarList data={[{ key: 'a', label: 'A', value: 5 }]} accent="litigation" />);
    expect(screen.getByTestId('bar-fill-a').className).toContain('from-(--series-litigation-from)');
  });
});

describe('BarList vertical orientation', () => {
  it('renders vertical columns with labels, values and height percentages', () => {
    render(<BarList data={data} orientation="vertical" accent="gc" height={160} />);
    expect(screen.getByText('ພະລັງງານນ້ຳ')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('(75%)')).toBeInTheDocument();
    const hydroFill = screen.getByTestId('bar-fill-hydro');
    expect(hydroFill.className).toContain('from-(--series-gc-from)');
    expect(hydroFill.className).toContain('to-(--series-gc-to)');
    expect(hydroFill).toHaveStyle({ height: '100%' });

    const solarFill = screen.getByTestId('bar-fill-solar');
    expect(solarFill).toHaveStyle({ height: '33%' });
  });
});

