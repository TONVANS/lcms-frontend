'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useForm, useWatch, type Control, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { useCan } from '@/components/guards/can';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList, type FileItem } from '@/components/shared/file-list';
import { GlassCard } from '@/components/shared/glass-card';
import { Stepper } from '@/components/shared/stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { documentsService } from '@/features/documents';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/money';
import { gcService } from '../api/gc.service';
import { EMPTY, displayDate as date, displayText as text, formatEquity } from '../lib/format';
import { emptyGcForm, gcFormSchema, toGcPayload, type GcFormValues } from '../schemas/gc.schema';
import {
  GC_FIELD_ORDER,
  GcFormFieldGroup,
  firstInvalidFieldId,
  type GcFieldGroup,
  type GcFormFieldName,
} from './gc-contract-form-fields';
import { applyGcServerErrors } from './gc-server-errors';

const TOTAL_STEPS = 4;
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const STEP_LABELS = [
  lo.gc.wizard.step1,
  lo.gc.wizard.step2,
  lo.gc.wizard.step3,
  lo.gc.wizard.step4,
] as const;
const STEPS = STEP_LABELS.map((label, i) => ({ id: i + 1, label }));

const STEP_FIELDS: Record<number, readonly GcFormFieldName[]> = {
  1: ['title', 'type', 'contractNo', 'counterparty', 'implementer'],
  2: ['signedDate', 'effectiveDate', 'endDate', 'termText'],
  3: ['value', 'equity'],
  4: ['notes'],
};

const STEP_GROUP: Record<number, GcFieldGroup> = { 1: 'general', 2: 'dates', 3: 'money', 4: 'notes' };

function stepOfField(name: GcFormFieldName): number {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if (fields.includes(name)) return Number(step);
  }
  return TOTAL_STEPS;
}

/** Live errors for `names`. `form.formState` is a render-time snapshot, so read each field's state. */
function pickErrors(
  form: UseFormReturn<GcFormValues>,
  names: readonly GcFormFieldName[],
): FieldErrors<GcFormValues> {
  const subset: Record<string, unknown> = {};
  for (const n of names) {
    const error = form.getFieldState(n).error;
    if (error) subset[n] = error;
  }
  return subset as FieldErrors<GcFormValues>;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface StagedFile {
  id: string;
  file: File;
}

function useFormValues(control: Control<GcFormValues>): GcFormValues {
  return useWatch({ control }) as GcFormValues;
}

function SummaryAside({ control, completed }: { control: Control<GcFormValues>; completed: number }) {
  const v = useFormValues(control);
  const headingId = useId();
  const rows: { label: string; value: string }[] = [
    { label: lo.gc.fields.title, value: text(v.title) },
    { label: lo.gc.fields.type, value: v.type ? lo.gc.types[v.type] : EMPTY },
    { label: lo.gc.fields.contractNo, value: text(v.contractNo) },
    { label: lo.gc.fields.effectiveDate, value: date(v.effectiveDate) },
    { label: lo.gc.fields.endDate, value: v.endDate ? formatDate(v.endDate) : EMPTY },
    { label: lo.gc.fields.value, value: v.value ? formatMoney(v.value) : EMPTY },
  ];
  return (
    <aside aria-labelledby={headingId} className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <GlassCard accent="gc" className="flex min-w-0 flex-col gap-4">
        <h2 id={headingId} className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.gc.wizard.summary}
        </h2>
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label={lo.gc.wizard.progress}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={completed}
            aria-valuetext={lo.gc.wizard.progressText(completed, TOTAL_STEPS)}
            className="h-2 overflow-hidden rounded-full bg-(--surface-inset)"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-(image:--gold-gradient) transition-transform duration-300 motion-reduce:transition-none"
              style={{ transform: `scaleX(${completed / TOTAL_STEPS})` }}
            />
          </div>
          <p className="text-xs text-(--text-muted) tabular-nums">
            {lo.gc.wizard.progressText(completed, TOTAL_STEPS)}
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.label} className="min-w-0">
              <span className="block text-xs text-(--text-muted)">{r.label}</span>
              <span className="block text-sm wrap-break-word text-(--text-strong)">{r.value}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </aside>
  );
}

function ReviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-(--text-muted)">{label}</dt>
      <dd className="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-(--text-strong)">{children}</dd>
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
            aria-label={lo.gc.wizard.editSection(label)}
            onClick={() => onEdit(step)}
          >
            {lo.gc.wizard.edit}
          </Button>
        ) : null}
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewStep({
  control,
  staged,
  onEdit,
  locked,
}: {
  control: Control<GcFormValues>;
  staged: StagedFile[];
  onEdit: (step: number) => void;
  locked: boolean;
}) {
  const v = useFormValues(control);
  const f = lo.gc.fields;
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h3 id={headingId} className="text-base font-semibold text-(--text-strong)">
        {lo.gc.wizard.review}
      </h3>
      <ReviewSection step={1} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.title}>{text(v.title)}</ReviewItem>
        <ReviewItem label={f.type}>{v.type ? lo.gc.types[v.type] : EMPTY}</ReviewItem>
        <ReviewItem label={f.contractNo}>
          <span className="tabular-nums">{text(v.contractNo)}</span>
        </ReviewItem>
        <ReviewItem label={f.counterparty}>{text(v.counterparty)}</ReviewItem>
        <ReviewItem label={f.implementer}>{text(v.implementer)}</ReviewItem>
      </ReviewSection>
      <ReviewSection step={2} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.signedDate}>
          <span className="tabular-nums">{date(v.signedDate)}</span>
        </ReviewItem>
        <ReviewItem label={f.effectiveDate}>
          <span className="tabular-nums">{date(v.effectiveDate)}</span>
        </ReviewItem>
        <ReviewItem label={f.endDate}>
          {v.endDate ? <span className="tabular-nums">{formatDate(v.endDate)}</span> : lo.gc.openEnded}
        </ReviewItem>
        <ReviewItem label={f.termText}>{text(v.termText)}</ReviewItem>
      </ReviewSection>
      <ReviewSection step={3} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.value}>
          <span className="tabular-nums">{v.value ? formatMoney(v.value) : EMPTY}</span>
        </ReviewItem>
        <ReviewItem label={f.equity}>
          <span className="tabular-nums">{formatEquity(v.equity)}</span>
        </ReviewItem>
      </ReviewSection>
      <ReviewSection step={4}>
        <ReviewItem label={f.notes}>{text(v.notes)}</ReviewItem>
        <ReviewItem label={f.documents}>
          {staged.length > 0 ? staged.map((s) => s.file.name).join(', ') : lo.gc.wizard.noFiles}
        </ReviewItem>
      </ReviewSection>
    </section>
  );
}

let stagedSeq = 0;

export function GcWizardView() {
  const router = useRouter();
  const canUpload = useCan('gc', 'create');
  const form = useForm<GcFormValues>({
    resolver: zodResolver(gcFormSchema),
    defaultValues: emptyGcForm(),
    shouldFocusError: false,
  });
  const { control, handleSubmit, trigger } = form;

  const [step, setStep] = useState(1);
  // Furthest step the user has reached, and how many steps from the start have passed validation.
  const [maxReached, setMaxReached] = useState(1);
  const [validated, setValidated] = useState(0);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Guards against a second create: the lock is synchronous, the id survives a failed upload.
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

  // After a step change, focus the requested field once it is mounted, else announce the heading.
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

  /** Going back is free; going forward validates every step from the current one up to the target. */
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
        goToStep(s, firstInvalidFieldId(pickErrors(form, fields)));
        return;
      }
    }
    setValidated((v) => Math.max(v, target - 1));
    goToStep(target);
  };

  const onInvalid = (errors: FieldErrors<GcFormValues>) => {
    const first = GC_FIELD_ORDER.find((n) => errors[n]);
    if (first) goToStep(stepOfField(first), firstInvalidFieldId(errors));
  };

  const onValid = async (values: GcFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setBanner(null);
    try {
      let justCreated = false;
      if (createdIdRef.current === null) {
        try {
          const created = await gcService.create(toGcPayload(values));
          createdIdRef.current = created.id;
          justCreated = true;
        } catch (e) {
          if (!mounted.current) return;
          const err = normalizeError(e);
          const { matched, unmatched, focusId } = applyGcServerErrors(form, err);
          if (matched.length > 0) goToStep(stepOfField(matched[0]), focusId);
          if (matched.length === 0 || unmatched) {
            const message = toUserMessage(err);
            if (message) setBanner(message);
            if (matched.length === 0) goToStep(TOTAL_STEPS);
          }
          return;
        }
      }
      const id = createdIdRef.current;
      const results = await Promise.allSettled(
        staged.map((s) => documentsService.upload('contracts', id, s.file)),
      );
      const failed = staged.filter((_, i) => results[i].status === 'rejected');
      // The user should learn about failed files even if they already navigated away.
      if (failed.length > 0) {
        toast.error(lo.gc.wizard.uploadFailed(failed.map((s) => s.file.name).join(', ')));
      }
      if (!mounted.current) return;
      setStaged(failed);
      if (justCreated) toast.success(lo.gc.wizard.created);
      router.replace(`/contracts/${id}`);
    } finally {
      // Once the contract exists navigation always follows, so the form stays locked until unmount.
      if (createdIdRef.current === null) {
        busyRef.current = false;
        setSubmitting(false);
      }
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) void goTo(step + 1);
    else void handleSubmit(onValid, onInvalid)();
  };

  const addFiles = (files: File[]) => {
    setStaged((prev) => [...prev, ...files.map((file) => ({ id: `staged-${++stagedSeq}`, file }))]);
  };

  const stagedItems: FileItem[] = staged.map((s) => ({
    id: s.id,
    name: s.file.name,
    size: s.file.size,
    mime: s.file.type,
  }));

  const stepLabel = STEP_LABELS[step - 1];

  return (
    <div className="mx-auto flex w-full max-w-[1180px] min-w-0 flex-col gap-6">
      <PageHeader eyebrow={MODULES.gc.code} title={lo.gc.wizard.title} accent="gc" />
      <Stepper
        steps={STEPS}
        currentStep={step}
        maxReachedStep={maxReached}
        onStepClick={submitting ? undefined : (s) => void goTo(s)}
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard accent="gc" className="min-w-0">
          <form noValidate aria-busy={submitting} onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-serif text-xl font-semibold text-(--text-strong) outline-none"
              >
                {stepLabel}
              </h2>
              <p className="text-xs text-(--text-muted)">
                {lo.stepper.step(step, TOTAL_STEPS)} · {lo.gc.form.requiredHint}
              </p>
            </div>

            <GcFormFieldGroup group={STEP_GROUP[step]} form={form} />

            {step === TOTAL_STEPS ? (
              <>
                <section aria-labelledby="gc-wizard-files" className="flex min-w-0 flex-col gap-3">
                  <h3 id="gc-wizard-files" className="text-base font-semibold text-(--text-strong)">
                    {lo.gc.fields.documents}
                  </h3>
                  {canUpload ? (
                    <>
                      <FileDropzone
                        disabled={submitting}
                        onFilesSelected={addFiles}
                        onReject={(messages) => toast.error(messages.join(' · '))}
                      />
                      <p className="text-xs text-(--text-muted)">{lo.gc.wizard.stagedHint}</p>
                    </>
                  ) : null}
                  {stagedItems.length > 0 ? (
                    <FileList
                      files={stagedItems}
                      onDelete={
                        submitting ? undefined : (file) => setStaged((prev) => prev.filter((s) => s.id !== file.id))
                      }
                    />
                  ) : null}
                </section>
                <ReviewStep control={control} staged={staged} onEdit={(s) => void goTo(s)} locked={submitting} />
              </>
            ) : null}

            {banner ? <AlertBanner tone="rose" title={banner} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border-subtle) pt-4">
              <Link
                href="/contracts/list"
                aria-disabled={submitting || undefined}
                tabIndex={submitting ? -1 : undefined}
                onClick={(e) => {
                  if (submitting) e.preventDefault();
                }}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  FOCUS_RING,
                  submitting && 'pointer-events-none opacity-50',
                )}
              >
                {lo.gc.form.cancel}
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                {step > 1 ? (
                  <Button type="button" variant="secondary" disabled={submitting} onClick={() => void goTo(step - 1)}>
                    {lo.gc.wizard.back}
                  </Button>
                ) : null}
                {step < TOTAL_STEPS ? (
                  <Button type="submit">{lo.gc.wizard.next}</Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? lo.gc.form.saving : lo.gc.wizard.submit}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </GlassCard>
        <SummaryAside control={control} completed={validated} />
      </div>
    </div>
  );
}
