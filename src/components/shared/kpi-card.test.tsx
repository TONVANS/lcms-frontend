import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders the value with tabular-nums', () => {
    render(<KpiCard label="L" value="1,240" />);
    expect(screen.getByText('1,240')).toHaveClass('tabular-nums');
  });
});
