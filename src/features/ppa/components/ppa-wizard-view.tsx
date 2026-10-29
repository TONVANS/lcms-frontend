'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormReturn,
} from 'react-hook-form';
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
import { useProjectTypes } from '@/features/lookups';
import { normalizeError } from '@/lib/api/errors';
import { MODULES } from '@/lib/constants/modules';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { ppaService } from '../api/ppa.service';
import { EMPTY, displayText, formatCapacity, formatTariff } from '../lib/format';
import {
  emptyPowerForm,
  toPowerContractPayload,
  type PowerFormField,
  type PowerFormValues,
} from '../schemas/ppa.schema';
import {
  PPA_FIELD_ORDER,
  PpaFormFieldGroup,
  firstInvalidFieldId,
  type PpaFieldGroup,
} from './ppa-contract-form-fields';
import { applyPpaServerError, makePowerResolver } from './ppa-form-support';

const TOTAL_STEPS = 4;
const FOCUS_RING =
  'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)';

const STEP_LABELS = [
  lo.ppa.wizard.step1,
  lo.ppa.wizard.step2,
  lo.ppa.wizard.step3,
  lo.ppa.wizard.step4,
] as const;
const STEPS = STEP_LABELS.map((label, i) => ({ id: i + 1, label }));

const STEP_FIELDS: Record<number, readonly PowerFormField[]> = {
  1: ['contractType', 'contractNumber', 'projectName', 'projectTypeOrCustomer', 'projectLocation'],
  2: ['signedDate', 'effectiveDate', 'expirationDate', 'durationText', 'durationMonths', 'notifyDaysBefore'],
  3: ['capacityValue', 'capacityUnit', 'tariffValue', 'tariffCurrency'],
  4: ['additionalDetails'],
};

const STEP_GROUP: Record<number, PpaFieldGroup> = { 1: 'general', 2: 'dates', 3: 'tech', 4: 'notes' };

function stepOfField(name: PowerFormField): number {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if (fields.includes(name)) return Number(step);
  }
  return TOTAL_STEPS;
}

/** Live errors for `names`. `form.formState` is a render-time snapshot, so read each field's state. */
function pickErrors(form: UseFormReturn<PowerFormValues>, names: readonly PowerFormField[]): FieldErrors<PowerFormValues> {
  const subset: Record<string, unknown> = {};
  for (const n of names) {
    const error = form.getFieldState(n).error;
    if (error) subset[n] = error;
  }
  return subset as FieldErrors<PowerFormValues>;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface StagedFile {
  id: string;
  file: File;
}

const useFormValues = (control: Control<PowerFormValues>): PowerFormValues =>
  useWatch({ control }) as PowerFormValues;

function SummaryAside({ control, completed }: { control: Control<PowerFormValues>; completed: number }) {
  const v = useFormValues(control);
  const headingId = useId();
  const f = lo.ppa.fields;
  const rows: { label: string; value: string }[] = [
    { label: f.contractType, value: v.contractType ? lo.ppa.types[v.contractType] : EMPTY },
    { label: f.contractNumber, value: displayText(v.contractNumber) },
    { label: f.projectName, value: displayText(v.projectName) },
    {
      label: v.contractType === 'SALE' ? f.customer : f.projectType,
      value: displayText(v.projectTypeOrCustomer),
    },
    { label: f.expirationDate, value: v.expirationDate ? formatDate(v.expirationDate) : EMPTY },
    {
      label: f.installedCapacity,
      value: v.capacityValue !== null && Number.isFinite(v.capacityValue) ? formatCapacity(v.capacityValue, v.capacityUnit) : EMPTY,
    },
  ];
  return (
    <aside aria-labelledby={headingId} className="min-w-0 lg:sticky lg:top-6 lg:self-start">
      <GlassCard accent="ppa" className="flex min-w-0 flex-col gap-4">
        <h2 id={headingId} className="font-serif text-lg font-semibold text-(--text-strong)">
          {lo.ppa.wizard.summary}
        </h2>
        <div className="flex flex-col gap-2">
          <div
            role="progressbar"
            aria-label={lo.ppa.wizard.progress}
            aria-valuemin={0}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={completed}
            aria-valuetext={lo.ppa.wizard.progressText(completed, TOTAL_STEPS)}
            className="h-2 overflow-hidden rounded-full bg-(--surface-inset)"
          >
            <div
              className="h-full w-full origin-left rounded-full bg-(image:--gold-gradient) transition-transform duration-300 motion-reduce:transition-none"
              style={{ transform: `scaleX(${completed / TOTAL_STEPS})` }}
            />
          </div>
          <p className="text-xs text-(--text-muted) tabular-nums">
            {lo.ppa.wizard.progressText(completed, TOTAL_STEPS)}
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
            aria-label={lo.ppa.wizard.editSection(label)}
            onClick={() => onEdit(step)}
          >
            {lo.ppa.wizard.edit}
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
  control: Control<PowerFormValues>;
  staged: StagedFile[];
  onEdit: (step: number) => void;
  locked: boolean;
}) {
  const v = useFormValues(control);
  const f = lo.ppa.fields;
  const headingId = useId();
  const num = (n: number | null) => (n !== null && Number.isFinite(n) ? n : null);
  const date = (d: string) => (d ? formatDate(d) : EMPTY);
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <h3 id={headingId} className="text-base font-semibold text-(--text-strong)">
        {lo.ppa.wizard.review}
      </h3>
      <ReviewSection step={1} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.contractType}>{lo.ppa.types[v.contractType]}</ReviewItem>
        <ReviewItem label={f.contractNumber}>{displayText(v.contractNumber)}</ReviewItem>
        <ReviewItem label={f.projectName}>{displayText(v.projectName)}</ReviewItem>
        <ReviewItem label={v.contractType === 'SALE' ? f.customer : f.projectType}>
          {displayText(v.projectTypeOrCustomer)}
        </ReviewItem>
        <ReviewItem label={f.projectLocation}>{displayText(v.projectLocation)}</ReviewItem>
      </ReviewSection>
      <ReviewSection step={2} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.signedDate}>{date(v.signedDate)}</ReviewItem>
        <ReviewItem label={f.effectiveDate}>{date(v.effectiveDate)}</ReviewItem>
        <ReviewItem label={f.expirationDate}>{date(v.expirationDate)}</ReviewItem>
        <ReviewItem label={f.durationText}>{displayText(v.durationText)}</ReviewItem>
        <ReviewItem label={f.notifyDaysBefore}>{num(v.notifyDaysBefore) ?? EMPTY}</ReviewItem>
      </ReviewSection>
      <ReviewSection step={3} onEdit={onEdit} locked={locked}>
        <ReviewItem label={f.installedCapacity}>{formatCapacity(num(v.capacityValue), v.capacityUnit)}</ReviewItem>
        <ReviewItem label={f.tariff}>{formatTariff(num(v.tariffValue), v.tariffCurrency)}</ReviewItem>
      </ReviewSection>
      <ReviewSection step={4}>
        <ReviewItem label={f.additionalDetails}>{displayText(v.additionalDetails)}</ReviewItem>
        <ReviewItem label={lo.ppa.detail.documents}>
          {staged.length > 0 ? staged.map((s) => s.file.name).join(', ') : lo.ppa.wizard.noFiles}
        </ReviewItem>
      </ReviewSection>
    </section>
  );
}

let stagedSeq = 0;

export function PpaWizardView() {
  const router = useRouter();
  const canUpload = useCan('ppa', 'create');
  const projectTypes = useProjectTypes();
  const form = useForm<PowerFormValues>({
    resolver: makePowerResolver({ types: projectTypes.items, ready: projectTypes.status === 'ready', initial: '' }),
    defaultValues: emptyPowerForm(),
    shouldFocusError: false,
  });
  const { control, handleSubmit, trigger } = form;

  const [step, setStep] = useState(1);
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

  const onInvalid = (errors: FieldErrors<PowerFormValues>) => {
    const first = PPA_FIELD_ORDER.find((n) => errors[n]);
    if (first) goToStep(stepOfField(first), firstInvalidFieldId(errors));
  };

  const onValid = async (values: PowerFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setBanner(null);
    try {
      let justCreated = false;
      if (createdIdRef.current === null) {
        try {
          const created = await ppaService.create(toPowerContractPayload(values));
          createdIdRef.current = created.id;
          justCreated = true;
        } catch (e) {
          if (!mounted.current) return;
          const applied = applyPpaServerError(form, normalizeError(e));
          if (applied.focusId) goToStep(1, applied.focusId);
          if (applied.banner) {
            setBanner(applied.banner);
            goToStep(TOTAL_STEPS);
          }
          return;
        }
      }
      const id = createdIdRef.current;
      const results = await Promise.allSettled(
        staged.map((s) => documentsService.upload('power-contracts', id, s.file)),
      );
      const failed = staged.filter((_, i) => results[i].status === 'rejected');
      if (failed.length > 0) {
        toast.error(lo.ppa.wizard.uploadFailed(failed.map((s) => s.file.name).join(', ')));
      }
      if (!mounted.current) return;
      setStaged(failed);
      if (justCreated) toast.success(lo.ppa.wizard.created);
      router.replace(`/ppa/contracts/${id}`);
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
      <PageHeader eyebrow={MODULES.ppa.code} title={lo.ppa.wizard.title} accent="ppa" />
      <Stepper
        steps={STEPS}
        currentStep={step}
        maxReachedStep={maxReached}
        onStepClick={submitting ? undefined : (s) => void goTo(s)}
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard accent="ppa" className="min-w-0">
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
                {lo.stepper.step(step, TOTAL_STEPS)} · {lo.ppa.form.requiredHint}
              </p>
            </div>

            <PpaFormFieldGroup group={STEP_GROUP[step]} form={form} />

            {step === TOTAL_STEPS ? (
              <>
                <section aria-labelledby="ppa-wizard-files" className="flex min-w-0 flex-col gap-3">
                  <h3 id="ppa-wizard-files" className="text-base font-semibold text-(--text-strong)">
                    {lo.ppa.detail.documents}
                  </h3>
                  {canUpload ? (
                    <>
                      <FileDropzone
                        disabled={submitting}
                        onFilesSelected={addFiles}
                        onReject={(messages) => toast.error(messages.join(' · '))}
                      />
                      <p className="text-xs text-(--text-muted)">{lo.ppa.wizard.stagedHint}</p>
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
                href="/ppa/contracts"
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
                {lo.ppa.form.cancel}
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                {step > 1 ? (
                  <Button type="button" variant="secondary" disabled={submitting} onClick={() => void goTo(step - 1)}>
                    {lo.ppa.wizard.back}
                  </Button>
                ) : null}
                {step < TOTAL_STEPS ? (
                  <Button type="submit">{lo.ppa.wizard.next}</Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? lo.ppa.form.saving : lo.ppa.wizard.submit}
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
