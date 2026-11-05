'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  useWatch,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { Stepper } from '@/components/shared/stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import type { AttachmentModule } from '@/types/domain';
import type { ApiError } from '@/types/api';
import { StagedFilesSection, useStagedFiles } from './staged-files';
import { uploadStaged } from './upload-staged';

const TOTAL_STEPS = 3;
const W = lo.legal.wizard;
const EMPTY = '—';

export interface WizardRow {
  label: string;
  value: string;
}

export interface WizardReviewSection {
  step: number;
  items: WizardRow[];
}

export interface LegalWizardProps<V extends FieldValues> {
  form: UseFormReturn<V>;
  module: AttachmentModule;
  title: string;
  stepLabels: readonly [string, string, string];
  stepFields: Record<number, readonly Path<V>[]>;
  fieldOrder: readonly Path<V>[];
  firstInvalidId: (errors: FieldErrors<V>) => string | null;
  renderFields: (fields: readonly Path<V>[]) => ReactNode;
  summaryTitle: string;
  summaryRows: (values: V) => WizardRow[];
  reviewSections: (values: V) => WizardReviewSection[];
  submitLabel: string;
  createdMessage: string;
  create: (values: V) => Promise<string>;
  /** Puts a server error on a form field; returns the field it landed on, or null. */
  applyServerError: (form: UseFormReturn<V>, err: ApiError) => Path<V> | null;
  detailHref: (id: string) => string;
  accent?: 'legal' | 'litigation';
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

/** Theme-aware Summary Card using GlassCard (Design.md sections 2.1, 2.2, 4 & 6) */
function SummaryAside<V extends FieldValues>({
  form,
  title,
  rows,
  completed,
  accent = 'legal',
}: {
  form: UseFormReturn<V>;
  title: string;
  rows: (v: V) => WizardRow[];
  completed: number;
  accent?: 'legal' | 'litigation';
}) {
  const values = useWatch({ control: form.control }) as V;
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} className="hidden w-80 shrink-0 flex-col gap-4 lg:flex lg:sticky lg:top-6 lg:self-start">
      <GlassCard accent={accent} className="flex min-w-0 flex-col gap-4 p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 id={headingId} className="font-serif text-sm font-semibold text-(--text-strong)">
            {title}
          </h3>
          <span className="text-xs font-semibold tabular-nums text-(--gold)">
            {completed} / {TOTAL_STEPS}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-(--text-muted)">
            <span>{W.progress}</span>
            <span className="font-medium tabular-nums text-(--text-strong)">{W.progressText(completed, TOTAL_STEPS)}</span>
          </div>
          {/* Design.md section 6: live summary panel with gold progress bar */}
          <div
            role="progressbar"
            aria-label={W.progress}
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            className="h-2 w-full overflow-hidden rounded-full border border-(--border-subtle) bg-(--surface-inset) p-0.5"
          >
            <div
              className="h-full rounded-full bg-(image:--gold-gradient) transition-all duration-300"
              style={{ width: `${(completed / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Design.md section 2.1 & 2.2: inner tiles on surface-inset */}
        <dl className="flex flex-col gap-2 text-xs">
          {rows(values).map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col rounded-[14px] border border-(--border-subtle) bg-(--surface-inset) p-2.5 transition-colors"
            >
              <dt className="text-[11px] font-medium text-(--text-muted)">{label}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-(--text-strong)">
                {value ? value : <span className="font-normal text-(--text-dim)">{EMPTY}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </GlassCard>
    </aside>
  );
}

function ReviewStep<V extends FieldValues>({
  form,
  sections,
  stepLabels,
  stagedNames,
  onEdit,
  locked,
  accent = 'legal',
}: {
  form: UseFormReturn<V>;
  sections: (v: V) => WizardReviewSection[];
  stepLabels: readonly string[];
  stagedNames: string[];
  onEdit: (step: number) => void;
  locked: boolean;
  accent?: 'legal' | 'litigation';
}) {
  const values = useWatch({ control: form.control }) as V;
  const headingId = useId();
  const isLitigation = accent === 'litigation';

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <h3 id={headingId} className="font-serif text-base font-semibold text-(--text-strong)">
        {W.review}
      </h3>
      {sections(values).map((s) => {
        const label = stepLabels[s.step - 1];
        const last = s.step === TOTAL_STEPS;
        return (
          <section
            key={s.step}
            aria-label={label}
            className="rounded-[16px] border border-(--border-subtle) bg-(--surface-inset) p-4.5"
          >
            <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-(--border-subtle) pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                    isLitigation
                      ? 'border border-(--litigation)/30 bg-(--litigation)/12 text-(--litigation)'
                      : 'border border-(--gold)/30 bg-(--gold)/12 text-(--gold)',
                  )}
                >
                  {s.step}
                </span>
                <h4 className="text-sm font-semibold text-(--text-strong)">{label}</h4>
              </div>
              {!last ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={locked}
                  aria-label={W.editSection(label)}
                  onClick={() => onEdit(s.step)}
                  className="h-8 gap-1.5 px-2.5 text-xs text-(--text-secondary) hover:text-(--gold)"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  <span>{W.edit}</span>
                </Button>
              ) : null}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {s.items.map((i) => (
                <div key={i.label} className="flex flex-col py-1">
                  <dt className="text-xs font-medium text-(--text-muted)">{i.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium tabular-nums wrap-break-word text-(--text-strong)">
                    {i.value ? i.value : <span className="font-normal text-(--text-dim)">{EMPTY}</span>}
                  </dd>
                </div>
              ))}
              {last ? (
                <div className="flex flex-col py-1">
                  <dt className="text-xs font-medium text-(--text-muted)">{lo.legal.fields.documents}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-(--text-strong)">
                    {stagedNames.length > 0 ? (
                      stagedNames.join(', ')
                    ) : (
                      <span className="font-normal text-(--text-dim)">{W.noFiles}</span>
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        );
      })}
    </section>
  );
}

/** Three-step create wizard conforming strictly to Design.md specs. */
export function LegalWizard<V extends FieldValues>(props: LegalWizardProps<V>) {
  const { form, stepFields, fieldOrder, stepLabels } = props;
  const accent = props.accent ?? 'legal';
  const isLitigation = accent === 'litigation';
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [validated, setValidated] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const files = useStagedFiles();

  const busyRef = useRef(false);
  const createdIdRef = useRef<string | null>(null);
  const mounted = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const prevStep = useRef(step);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    const id = pendingFocus.current;
    pendingFocus.current = null;
    if (id) focusById(id);
    else headingRef.current?.focus();
  }, [step]);

  const stepOfField = (name: string): number => {
    for (const [s, fields] of Object.entries(stepFields)) {
      if ((fields as readonly string[]).includes(name)) return Number(s);
    }
    return TOTAL_STEPS;
  };

  const pickErrors = (names: readonly Path<V>[]): FieldErrors<V> => {
    const subset: Record<string, unknown> = {};
    for (const n of names) {
      const error = form.getFieldState(n).error;
      if (error) subset[n] = error;
    }
    return subset as FieldErrors<V>;
  };

  const goToStep = (target: number, focusId: string | null = null) => {
    if (target === step) {
      if (focusId) focusById(focusId);
      else headingRef.current?.focus();
      return;
    }
    pendingFocus.current = focusId;
    setMaxReached((m) => Math.max(m, target));
    setStep(target);
  };

  const goTo = async (target: number) => {
    if (target <= step) {
      goToStep(target);
      return;
    }
    for (let s = step; s < target; s++) {
      const fields = stepFields[s];
      const ok = await form.trigger([...fields]);
      if (!ok) {
        setValidated((v) => Math.min(v, s - 1));
        goToStep(s, props.firstInvalidId(pickErrors(fields)));
        return;
      }
    }
    setValidated((v) => Math.max(v, target - 1));
    goToStep(target);
  };

  const onInvalid = (errors: FieldErrors<V>) => {
    const first = fieldOrder.find((n) => (errors as Record<string, unknown>)[n]);
    if (first) goToStep(stepOfField(first), props.firstInvalidId(errors));
  };

  const onValid = async (values: V) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setBanner(null);
    try {
      if (createdIdRef.current === null) {
        try {
          createdIdRef.current = await props.create(values);
        } catch (e) {
          busyRef.current = false;
          setSubmitting(false);
          if (!mounted.current) return;
          const err = normalizeError(e);
          const field = props.applyServerError(form, err);
          if (field) {
            goToStep(stepOfField(field), props.firstInvalidId({ [field]: { type: 'server' } } as FieldErrors<V>));
          } else {
            const message = toUserMessage(err);
            if (message) setBanner(message);
            goToStep(TOTAL_STEPS);
          }
          return;
        }
      }
      const id = createdIdRef.current;
      if (files.staged.length > 0) {
        const { failed } = await uploadStaged(
          files.staged.map((s) => s.file),
          props.module,
          id,
        );
        if (failed.length > 0) toast.error(W.uploadFailed(failed.map((f) => f.name).join(', ')));
      }
      if (!mounted.current) return;
      toast.success(props.createdMessage);
      router.push(props.detailHref(id));
    } catch {
      busyRef.current = false;
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) void goTo(step + 1);
    else void form.handleSubmit(onValid, onInvalid)();
  };

  const steps = stepLabels.map((label, i) => ({ id: i + 1, label }));
  const completed = Math.max(validated, step - 1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <PageHeader title={props.title} meta={<p className="text-[13px] text-(--text-muted)">{W.description}</p>} accent="legal" />

      {banner ? <AlertBanner tone="rose" title={banner} /> : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <GlassCard accent={accent} className="relative overflow-hidden rounded-[22px] p-6 shadow-card">
            <div className="mb-6">
              <Stepper steps={steps} currentStep={step} onStepClick={goTo} maxReachedStep={maxReached} />
            </div>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
              <div tabIndex={-1} ref={headingRef} className="outline-hidden">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
                      isLitigation
                        ? 'border border-(--litigation)/30 bg-(--litigation)/12 text-(--litigation)'
                        : 'border border-(--gold)/30 bg-(--gold)/12 text-(--gold)',
                    )}
                  >
                    <span>{lo.stepper.step(step, TOTAL_STEPS)}</span>
                  </span>
                  <h2 className="font-serif text-xl font-semibold text-(--text-strong)">{stepLabels[step - 1]}</h2>
                </div>
              </div>

              {step < TOTAL_STEPS ? props.renderFields(stepFields[step]) : null}

              {step === TOTAL_STEPS ? (
                <div className="flex flex-col gap-6">
                  {props.renderFields(stepFields[TOTAL_STEPS])}
                  <StagedFilesSection
                    staged={files.staged}
                    onAdd={files.add}
                    onRemove={files.remove}
                    disabled={submitting}
                    hint={W.stagedHint}
                  />
                  <ReviewStep
                    form={form}
                    sections={props.reviewSections}
                    stepLabels={stepLabels}
                    stagedNames={files.staged.map((s) => s.file.name)}
                    onEdit={goToStep}
                    locked={submitting}
                    accent={accent}
                  />
                </div>
              ) : null}

              {/* Design.md section 6: Action bar (Cancel ghost, Back secondary, Next/Submit gold) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border-subtle) pt-5">
                <div>
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitting}
                      onClick={() => void goTo(step - 1)}
                      className="gap-1.5"
                    >
                      <ChevronLeft className="size-4 transition-transform duration-150 ease-out-soft group-hover/button:-translate-x-0.5" aria-hidden="true" />
                      <span>{W.back}</span>
                    </Button>
                  ) : (
                    <Link
                      href="/legal"
                      className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1.5')}
                      aria-disabled={submitting}
                    >
                      <X className="size-4" aria-hidden="true" />
                      <span>{lo.legal.regulations.form.cancel}</span>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {step < TOTAL_STEPS ? (
                    <Button
                      key="wizard-next-btn"
                      type="button"
                      variant="gold"
                      onClick={() => void goTo(step + 1)}
                      className="min-w-28 gap-1.5"
                    >
                      <span>{W.next}</span>
                      <ChevronRight className="size-4 transition-transform duration-150 ease-out-soft group-hover/button:translate-x-0.5" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      key="wizard-submit-btn"
                      type="submit"
                      disabled={submitting}
                      variant="gold"
                      className="min-w-32 gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          <span>{lo.legal.regulations.form.saving}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          <span>{props.submitLabel}</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </GlassCard>
        </div>

        <SummaryAside
          form={form}
          title={props.summaryTitle}
          rows={props.summaryRows}
          completed={completed}
          accent={accent}
        />
      </div>
    </div>
  );
}
