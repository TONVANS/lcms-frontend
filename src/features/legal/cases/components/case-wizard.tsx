'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useForm, useWatch, type Control, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GlassCard } from '@/components/shared/glass-card';
import { Stepper } from '@/components/shared/stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/number';
import { casesService } from '../api/cases.service';
import { caseTotal } from '../lib/case-money';
import {
  emptyCaseForm,
  caseFormSchema,
  toCasePayload,
  type CaseFormValues,
} from '../schemas/case.schema';
import {
  CASE_FIELD_ORDER,
  CaseFormFields,
  firstInvalidCaseFieldId,
  type CaseFormFieldName,
} from './case-form-fields';

const TOTAL_STEPS = 3;
const W = lo.legal.wizard;
const WC = lo.legal.wizard.cases;
const F = lo.legal.fields;
const EMPTY = '—';

const STEP_LABELS = [WC.step1, WC.step2, WC.step3] as const;
const STEPS = STEP_LABELS.map((label, i) => ({ id: i + 1, label }));

const STEP_FIELDS: Record<number, readonly CaseFormFieldName[]> = {
  1: ['defendant', 'allegation', 'handlingUnit', 'caseType', 'stage', 'disputeDate'],
  2: ['damage', 'fine', 'recovered'],
  3: ['progress'],
};

function stepOfField(name: CaseFormFieldName): number {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if (fields.includes(name)) return Number(step);
  }
  return TOTAL_STEPS;
}

function pickErrors(
  form: UseFormReturn<CaseFormValues>,
  names: readonly CaseFormFieldName[],
): FieldErrors<CaseFormValues> {
  const subset: Record<string, unknown> = {};
  for (const n of names) {
    const error = form.getFieldState(n).error;
    if (error) subset[n] = error;
  }
  return subset as FieldErrors<CaseFormValues>;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

function useFormValues(control: Control<CaseFormValues>): CaseFormValues {
  return useWatch({ control }) as CaseFormValues;
}

function SummaryAside({ control, completed }: { control: Control<CaseFormValues>; completed: number }) {
  const v = useFormValues(control);
  const headingId = useId();

  const total = caseTotal({
    damage: v.damage ?? { lak: null, usd: null },
    fine: v.fine ?? { lak: null, usd: null },
  });

  const totalStr =
    total.lak !== null || total.usd !== null
      ? `${total.lak !== null ? `${formatNumber(total.lak)} LAK` : ''}${
          total.lak !== null && total.usd !== null ? ' · ' : ''
        }${total.usd !== null ? `${formatNumber(total.usd)} USD` : ''}`
      : EMPTY;

  const rows: { label: string; value: string }[] = [
    { label: F.defendant, value: v.defendant.trim() || EMPTY },
    { label: F.allegation, value: v.allegation.trim() || EMPTY },
    { label: F.handlingUnit, value: v.handlingUnit.trim() || EMPTY },
    { label: F.caseType, value: v.caseType ? lo.legal.caseTypes[v.caseType] : EMPTY },
    { label: F.stage, value: v.stage ? lo.legal.caseStages[v.stage] : EMPTY },
    { label: F.total, value: totalStr },
  ];

  return (
    <aside
      aria-labelledby={headingId}
      className="hidden w-80 shrink-0 flex-col gap-4 lg:flex"
    >
      <GlassCard className="flex flex-col gap-4 p-5">
        <h3 id={headingId} className="text-sm font-semibold text-(--text-strong)">
          {WC.summary}
        </h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-(--text-muted)">
            <span>{W.progress}</span>
            <span>{W.progressText(completed, TOTAL_STEPS)}</span>
          </div>
          <div
            role="progressbar"
            aria-label={W.progress}
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            className="h-1.5 w-full overflow-hidden rounded-full bg-(--surface-sunken)"
          >
            <div
              className="h-full bg-(--litigation) transition-all duration-300"
              style={{ width: `${(completed / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <dl className="flex flex-col divide-y divide-(--border-subtle) text-xs">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-col py-2 first:pt-0 last:pb-0">
              <dt className="text-(--text-muted)">{label}</dt>
              <dd className="mt-0.5 truncate font-medium text-(--text-strong)">{value}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>
    </aside>
  );
}

function ReviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col py-1.5">
      <dt className="text-xs text-(--text-muted)">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-(--text-strong)">{children}</dd>
    </div>
  );
}

function ReviewSection({
  step,
  onEdit,
  locked = false,
  children,
}: {
  step: number;
  onEdit?: (step: number) => void;
  locked?: boolean;
  children: ReactNode;
}) {
  const headingId = useId();
  const label = STEP_LABELS[step - 1];
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-(--border-subtle) p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 id={headingId} className="text-sm font-semibold text-(--text-strong)">
          {label}
        </h4>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={locked}
            aria-label={W.editSection(label)}
            onClick={() => onEdit(step)}
          >
            {W.edit}
          </Button>
        ) : null}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewStep({
  control,
  onEdit,
  locked,
}: {
  control: Control<CaseFormValues>;
  onEdit: (step: number) => void;
  locked: boolean;
}) {
  const v = useFormValues(control);
  const headingId = useId();

  const total = caseTotal({
    damage: v.damage ?? { lak: null, usd: null },
    fine: v.fine ?? { lak: null, usd: null },
  });

  const formatDual = (val?: { lak: number | null; usd: number | null }) => {
    if (!val) return EMPTY;
    const parts: string[] = [];
    if (val.lak !== null) parts.push(`${formatNumber(val.lak)} LAK`);
    if (val.usd !== null) parts.push(`${formatNumber(val.usd)} USD`);
    return parts.length > 0 ? parts.join(' · ') : EMPTY;
  };

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <h3 id={headingId} className="text-base font-semibold text-(--text-strong)">
        {W.review}
      </h3>
      <ReviewSection step={1} onEdit={onEdit} locked={locked}>
        <ReviewItem label={F.defendant}>{v.defendant || EMPTY}</ReviewItem>
        <ReviewItem label={F.allegation}>{v.allegation || EMPTY}</ReviewItem>
        <ReviewItem label={F.handlingUnit}>{v.handlingUnit || EMPTY}</ReviewItem>
        <ReviewItem label={F.caseType}>{v.caseType ? lo.legal.caseTypes[v.caseType] : EMPTY}</ReviewItem>
        <ReviewItem label={F.stage}>{v.stage ? lo.legal.caseStages[v.stage] : EMPTY}</ReviewItem>
        <ReviewItem label={F.disputeDate}>
          {v.disputeDate ? formatDate(v.disputeDate) : EMPTY}
        </ReviewItem>
      </ReviewSection>

      <ReviewSection step={2} onEdit={onEdit} locked={locked}>
        <ReviewItem label={F.damage}>{formatDual(v.damage)}</ReviewItem>
        <ReviewItem label={F.fine}>{formatDual(v.fine)}</ReviewItem>
        <ReviewItem label={F.total}>{formatDual(total)}</ReviewItem>
        <ReviewItem label={F.recovered}>{formatDual(v.recovered)}</ReviewItem>
      </ReviewSection>

      <ReviewSection step={3}>
        <ReviewItem label={F.progress}>{v.progress || EMPTY}</ReviewItem>
      </ReviewSection>
    </section>
  );
}

export function CaseWizard() {
  const router = useRouter();
  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: emptyCaseForm(),
    shouldFocusError: false,
  });
  const { control, handleSubmit, trigger } = form;

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [validated, setValidated] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const fields = STEP_FIELDS[s];
      const ok = await trigger([...fields]);
      if (!ok) {
        setValidated((v) => Math.min(v, s - 1));
        goToStep(s, firstInvalidCaseFieldId(pickErrors(form, fields)));
        return;
      }
    }
    setValidated((v) => Math.max(v, target - 1));
    goToStep(target);
  };

  const onInvalid = (errors: FieldErrors<CaseFormValues>) => {
    const first = CASE_FIELD_ORDER.find((n) => errors[n]);
    if (first) goToStep(stepOfField(first), firstInvalidCaseFieldId(errors));
  };

  const onValid = async (values: CaseFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setBanner(null);

    try {
      if (createdIdRef.current === null) {
        try {
          const created = await casesService.create(toCasePayload(values));
          createdIdRef.current = created.id;
        } catch (e) {
          busyRef.current = false;
          setSubmitting(false);
          if (!mounted.current) return;
          const err = normalizeError(e);
          const message = toUserMessage(err);
          if (message) setBanner(message);
          return;
        }
      }

      const id = createdIdRef.current;
      if (!mounted.current) return;
      toast.success(WC.created);
      router.push(`/legal/cases/${id}`);
    } catch {
      busyRef.current = false;
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) void goTo(step + 1);
    else void handleSubmit(onValid, onInvalid)();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={WC.title} meta={<p>{lo.legal.wizard.description}</p>} />

      {banner ? <AlertBanner tone="rose" title={banner} /> : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <GlassCard className="p-6">
            <nav aria-label={lo.stepper.nav} className="mb-6">
              <Stepper
                steps={STEPS}
                currentStep={step}
                onStepClick={goTo}
                maxReachedStep={maxReached}
              />
            </nav>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
              <div tabIndex={-1} ref={headingRef} className="outline-hidden">
                <h2 className="text-lg font-semibold text-(--text-strong)">
                  {STEP_LABELS[step - 1]}
                </h2>
              </div>

              {step === 1 ? (
                <CaseFormFields form={form} fields={STEP_FIELDS[1]} />
              ) : null}

              {step === 2 ? (
                <CaseFormFields form={form} fields={STEP_FIELDS[2]} />
              ) : null}

              {step === 3 ? (
                <div className="flex flex-col gap-6">
                  <CaseFormFields form={form} fields={STEP_FIELDS[3]} />
                  <ReviewStep
                    control={control}
                    onEdit={goToStep}
                    locked={submitting}
                  />
                </div>
              ) : null}

              <div className="flex items-center justify-between border-t border-(--border-subtle) pt-5">
                <div>
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => goTo(step - 1)}
                    >
                      {W.back}
                    </Button>
                  ) : (
                    <Link
                      href="/legal/cases"
                      className={cn(buttonVariants({ variant: 'outline' }))}
                      aria-disabled={submitting}
                    >
                      {lo.legal.cases.form.cancel}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {step < TOTAL_STEPS ? (
                    <Button
                      type="button"
                      onClick={() => goTo(step + 1)}
                      className="bg-(--litigation) text-white hover:bg-(--litigation)/90"
                    >
                      {W.next}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-(--litigation) text-white hover:bg-(--litigation)/90"
                    >
                      {submitting ? lo.legal.cases.form.saving : WC.submit}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </GlassCard>
        </div>

        <SummaryAside control={control} completed={Math.max(validated, step - 1)} />
      </div>
    </div>
  );
}
