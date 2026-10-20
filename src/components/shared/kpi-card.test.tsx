import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders the value with tabular-nums', () => {
    render(<KpiCard label="L" value="1,240" />);
    expect(screen.getByText('1,240')).toHaveClass('tabular-nums');
  });

  it('info variant applies the blue tinted glass overrides', () => {
    const { container } = render(<KpiCard label="L" value="3" variant="info" />);
    const card = container.querySelector('.glass') as HTMLElement;
    expect(card.className).toContain('rgba(37,99,235');
    expect(card.className).toContain('dark:[--glass-border:rgba(96,165,250');
  });
});
