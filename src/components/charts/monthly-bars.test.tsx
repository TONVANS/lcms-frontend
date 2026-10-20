import { render, screen } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const barSpy = vi.fn();

vi.mock('recharts', async (orig) => ({
  ...(await orig<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactElement }) =>
    cloneElement(children as ReactElement<{ width: number; height: number }>, {
      width: 400,
      height: 200,
    }),
  Bar: (props: Record<string, unknown>) => {
    barSpy(props);
    return null;
  },
}));

import { lo } from '@/lib/i18n/lo';
import { MonthlyBars, MonthlyBarsTooltip } from './monthly-bars';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

describe('MonthlyBars', () => {
  beforeEach(() => barSpy.mockClear());

  it('disables animation under reduced motion', () => {
    mockMatchMedia(true);
    const { container } = render(<MonthlyBars data={[{ month: '2026-01', count: 2 }]} />);
    expect(container.innerHTML).not.toContain('ລາຍການ');
    expect(barSpy).toHaveBeenCalled();
    expect(barSpy.mock.calls.at(-1)![0].isAnimationActive).toBe(false);
  });

  it('keeps animation when motion is allowed', () => {
    mockMatchMedia(false);
    render(<MonthlyBars data={[{ month: '2026-01', count: 2 }]} />);
    expect(barSpy).toHaveBeenCalled();
    expect(barSpy.mock.calls.at(-1)![0].isAnimationActive).toBe(true);
  });

  it.each(['ppa', 'gc', 'legal', 'litigation'] as const)(
    'gradient stops reference series tokens for %s',
    (accent) => {
      mockMatchMedia(false);
      const { container } = render(
        <MonthlyBars data={[{ month: '2026-01', count: 2 }]} accent={accent} />,
      );
      const html = container.innerHTML;
      expect(html).toContain(`var(--series-${accent}-from)`);
      expect(html).toContain(`var(--series-${accent}-to)`);
      expect(html.toLowerCase()).not.toContain('#be123c');
    },
  );

  it('tooltip shows the localized items label', () => {
    render(<MonthlyBarsTooltip active payload={[{ value: 4, payload: { month: '2026-01' } }]} />);
    expect(screen.getByText(`4 ${lo.charts.items}`)).toBeInTheDocument();
  });

  it('uses unique gradient ids per instance', () => {
    mockMatchMedia(false);
    render(<MonthlyBars data={[{ month: '2026-01', count: 2 }]} />);
    render(<MonthlyBars data={[{ month: '2026-01', count: 2 }]} />);
    const fills = barSpy.mock.calls.map((c) => c[0].fill as string);
    expect(new Set(fills).size).toBeGreaterThan(1);
  });
});
