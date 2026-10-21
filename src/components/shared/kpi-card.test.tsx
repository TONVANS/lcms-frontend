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

describe('KpiCard delta tone and interactive', () => {
  it('neutral delta (positive undefined) is muted, not green or red', () => {
    render(<KpiCard label="L" value="1" delta={{ text: 'n' }} />);
    const el = screen.getByText('n');
    expect(el.className).toContain('text-(--text-muted)');
    expect(el.className).not.toContain('#047857');
    expect(el.className).not.toContain('#BE123C');
  });

  it('positive and negative deltas keep their colours', () => {
    render(
      <>
        <KpiCard label="A" value="1" delta={{ text: 'up', positive: true }} />
        <KpiCard label="B" value="1" delta={{ text: 'down', positive: false }} />
      </>,
    );
    expect(screen.getByText('up').className).toContain('#047857');
    expect(screen.getByText('down').className).toContain('#BE123C');
  });

  it('interactive adds the hover lift', () => {
    const { container } = render(<KpiCard label="L" value="1" interactive />);
    expect(container.querySelector('.glass')!.className).toContain('hover:-translate-y');
  });
});
