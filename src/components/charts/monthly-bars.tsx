'use client';

import { useId, useSyncExternalStore } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';

export interface MonthlyBarItem {
  month: string;
  count: number;
}

export interface MonthlyBarsProps {
  data: MonthlyBarItem[];
  accent?: 'ppa' | 'gc' | 'legal' | 'litigation';
  height?: number;
  className?: string;
}

const ACCENT_COLORS = {
  ppa: { from: '#2563eb', to: '#5cc8ff' },
  gc: { from: '#4f46e5', to: '#8b9cff' },
  legal: { from: '#9c7c45', to: '#d4b37a' },
  litigation: { from: '#be123c', to: '#fb7185' },
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getReducedMotion() {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotion() {
  return false;
}

export function MonthlyBars({
  data,
  accent = 'ppa',
  height = 220,
  className,
}: MonthlyBarsProps) {
  const config = ACCENT_COLORS[accent] ?? ACCENT_COLORS.ppa;
  const fillId = `monthly-bars-${useId().replace(/:/g, '')}`;
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
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
                  <div className="rounded-lg border border-[var(--border-glass)] bg-(image:--surface-modal) p-2 shadow-xl backdrop-blur-md">
                    <p className="text-[11px] text-[var(--text-muted)]">{item.payload.month}</p>
                    <p className="text-xs font-semibold tabular-nums text-[var(--text-strong)]">
                      {item.value} {lo.charts.items}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            fill={`url(#${fillId})`}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            isAnimationActive={!prefersReducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
