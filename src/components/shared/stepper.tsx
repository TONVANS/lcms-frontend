'use client';

import { Check } from 'lucide-react';
import { lo } from '@/lib/i18n/lo';
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
  /** Highest step already reached; steps up to it stay done and clickable. Defaults to `currentStep`. */
  maxReachedStep?: number;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, maxReachedStep = currentStep, className }: StepperProps) {
  return (
    <nav aria-label={lo.stepper.nav} className={cn('w-full', className)}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCurrent = currentStep === step.id;
          const isDone = !isCurrent && (currentStep > step.id || maxReachedStep >= step.id);
          const state = isDone ? 'done' : isCurrent ? 'current' : 'todo';
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
                  aria-label={lo.stepper.stepName(step.id, step.label, state)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-[transform,opacity] duration-200',
                    'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)',
                    isDone &&
                      'bg-(image:--gold-gradient) text-[#0a1630] shadow-md',
                    isCurrent &&
                      'bg-(image:--primary-gradient) text-white ring-4 ring-(--primary)/25 shadow-md',
                    !isDone &&
                      !isCurrent &&
                      'border border-[var(--border-glass)] bg-[var(--surface-glass)] text-[var(--text-dim)]',
                    isClickable && 'cursor-pointer hover:scale-105',
                  )}
                >
                  {isDone ? <Check aria-hidden="true" className="h-4 w-4 stroke-[2.5]" /> : step.id}
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
                    'mx-2 h-0.5 flex-1',
                    isDone ? 'bg-(--gold-decor)' : 'bg-[var(--border-subtle)]',
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
