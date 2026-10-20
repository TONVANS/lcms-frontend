'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StepItem {
  id: number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = Boolean(onStepClick && isDone);

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex flex-1 items-center',
                idx === steps.length - 1 ? 'flex-initial' : 'w-full',
              )}
            >
              <div className="group flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                    'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
                    isDone &&
                      'bg-gradient-to-br from-[#b08a4a] to-[#d4b37a] text-[#0a1630] shadow-md shadow-[#d4b37a]/20',
                    isCurrent &&
                      'bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white ring-4 ring-[#2563eb]/25 shadow-md shadow-blue-500/30',
                    !isDone &&
                      !isCurrent &&
                      'border border-[var(--border-glass)] bg-[var(--surface-glass)] text-[var(--text-dim)]',
                    isClickable && 'cursor-pointer hover:scale-105',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.id}
                </button>
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'block text-xs font-medium',
                      isCurrent
                        ? 'font-semibold text-[var(--text-strong)]'
                        : isDone
                          ? 'text-[var(--text)]'
                          : 'text-[var(--text-dim)]',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="hidden text-[10px] text-[var(--text-muted)] sm:block">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-2 h-0.5 flex-1 transition-colors duration-200',
                    isDone ? 'bg-[#d4b37a]' : 'bg-[var(--border-subtle)]',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
