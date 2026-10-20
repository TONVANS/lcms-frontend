'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils/cn';

export interface MonthlyBarItem {
  month: string;
  count: number;
}

export interface MonthlyBarsProps {
  data: MonthlyBarItem[];
  accent?: 'ppa' | 'gc' | 'legal';
  height?: number;
  className?: string;
}

const ACCENT_COLORS = {
  ppa: { from: '#2563eb', to: '#5cc8ff', fillId: 'ppaGradient' },
  gc: { from: '#4f46e5', to: '#8b9cff', fillId: 'gcGradient' },
  legal: { from: '#9c7c45', to: '#d4b37a', fillId: 'legalGradient' },
};

export function MonthlyBars({
  data,
  accent = 'ppa',
  height = 220,
  className,
}: MonthlyBarsProps) {
  const config = ACCENT_COLORS[accent] ?? ACCENT_COLORS.ppa;

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={config.fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.to} stopOpacity={0.9} />
              <stop offset="100%" stopColor={config.from} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.06)"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="rounded-lg border border-[var(--border-glass)] bg-[var(--surface-modal)] p-2 shadow-xl backdrop-blur-md">
                    <p className="text-[11px] text-[var(--text-muted)]">{item.payload.month}</p>
                    <p className="text-xs font-semibold tabular-nums text-[var(--text-strong)]">
                      {item.value} ລາຍການ
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            fill={`url(#${config.fillId})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
