'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useForm, useWatch, type Control, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { AlertBanner } from '@/components/shared/alert-banner';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { FileList, type FileItem } from '@/components/shared/file-list';
import { GlassCard } from '@/components/shared/glass-card';
import { Stepper } from '@/components/shared/stepper';
import { Button, buttonVariants } from '@/components/ui/button';
import { normalizeError, toUserMessage } from '@/lib/api/errors';
import { lo } from '@/lib/i18n/lo';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/date';
import { uploadStaged } from '../../lib/upload-staged';
import { regulationsService } from '../api/regulations.service';
import {
  emptyRegulationForm,
  regulationFormSchema,
  toRegulationPayload,
  type RegulationFormValues,
} from '../schemas/regulation.schema';
import {
  REGULATION_FIELD_ORDER,
  RegulationFormFields,
  firstInvalidRegulationFieldId,
  type RegulationFormFieldName,
} from './regulation-form-fields';
import { applyRegulationServerErrors } from '../lib/regulation-server-errors';

const TOTAL_STEPS = 3;
const W = lo.legal.wizard;
const WR = lo.legal.wizard.regulations;
const F = lo.legal.fields;
const EMPTY = '—';

const STEP_LABELS = [WR.step1, WR.step2, WR.step3] as const;
const STEPS = STEP_LABELS.map((label, i) => ({ id: i + 1, label }));

const STEP_FIELDS: Record<number, readonly RegulationFormFieldName[]> = {
  1: ['title', 'type', 'typeOther', 'number', 'issuedDate', 'year'],
  2: ['unit', 'responsible', 'status', 'purpose'],
  3: ['externalLinks'],
};

function stepOfField(name: RegulationFormFieldName): number {
  for (const [step, fields] of Object.entries(STEP_FIELDS)) {
    if (fields.includes(name)) return Number(step);
  }
  return TOTAL_STEPS;
}

function pickErrors(
  form: UseFormReturn<RegulationFormValues>,
  names: readonly RegulationFormFieldName[],
): FieldErrors<RegulationFormValues> {
  const subset: Record<string, unknown> = {};
  for (const n of names) {
    const error = form.getFieldState(n).error;
    if (error) subset[n] = error;
  }
  return subset as FieldErrors<RegulationFormValues>;
}

function focusById(id: string | null): void {
  if (id) document.getElementById(id)?.focus();
}

interface StagedFile {
  id: string;
  file: File;
}

let stagedSeq = 0;

function useFormValues(control: Control<RegulationFormValues>): RegulationFormValues {
  return useWatch({ control }) as RegulationFormValues;
}

function SummaryAside({ control, completed }: { control: Control<RegulationFormValues>; completed: number }) {
  const v = useFormValues(control);
  const headingId = useId();
  const rows: { label: string; value: string }[] = [
    { label: F.title, value: v.title.trim() || EMPTY },
    {
      label: F.type,
      value: v.type === 'other' ? v.typeOther.trim() || EMPTY : lo.legal.regulationTypes[v.type] || EMPTY,
    },
    { label: F.number, value: v.number.trim() || EMPTY },
    { label: F.issuedDate, value: v.issuedDate ? formatDate(v.issuedDate) : EMPTY },
    { label: F.unit, value: v.unit ? lo.legal.units[v.unit] : EMPTY },
    { label: F.status, value: v.status ? lo.legal.regulationStatus[v.status] : EMPTY },
  ];

  return (
    <aside
      aria-labelledby={headingId}
      className="hidden w-80 shrink-0 flex-col gap-4 lg:flex"
    >
      <GlassCard className="flex flex-col gap-4 p-5">
        <h3 id={headingId} className="text-sm font-semibold text-(--text-strong)">
          {WR.summary}
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
              className="h-full bg-(--gold) transition-all duration-300"
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
  staged,
  onEdit,
  locked,
}: {
  control: Control<RegulationFormValues>;
  staged: StagedFile[];
  onEdit: (step: number) => void;
  locked: boolean;
}) {
  const v = useFormValues(control);
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
      <h3 id={headingId} className="text-base font-semibold text-(--text-strong)">
        {W.review}
      </h3>
      <ReviewSection step={1} onEdit={onEdit} locked={locked}>
        <ReviewItem label={F.title}>{v.title || EMPTY}</ReviewItem>
        <ReviewItem label={F.type}>
          {v.type === 'other' ? v.typeOther || EMPTY : lo.legal.regulationTypes[v.type] || EMPTY}
        </ReviewItem>
        <ReviewItem label={F.number}>{v.number || EMPTY}</ReviewItem>
        <ReviewItem label={F.issuedDate}>
          {v.issuedDate ? formatDate(v.issuedDate) : EMPTY}
        </ReviewItem>
        <ReviewItem label={F.year}>{v.year || EMPTY}</ReviewItem>
      </ReviewSection>

      <ReviewSection step={2} onEdit={onEdit} locked={locked}>
        <ReviewItem label={F.unit}>{v.unit ? lo.legal.units[v.unit] : EMPTY}</ReviewItem>
        <ReviewItem label={F.responsible}>{v.responsible || EMPTY}</ReviewItem>
        <ReviewItem label={F.status}>{v.status ? lo.legal.regulationStatus[v.status] : EMPTY}</ReviewItem>
        <ReviewItem label={F.purpose}>{v.purpose || EMPTY}</ReviewItem>
      </ReviewSection>

      <ReviewSection step={3}>
        <ReviewItem label={F.externalLinks}>
          {v.externalLinks && v.externalLinks.length > 0 ? v.externalLinks.join(', ') : W.noLinks}
        </ReviewItem>
        <ReviewItem label={F.documents}>
          {staged.length > 0 ? staged.map((s) => s.file.name).join(', ') : W.noFiles}
        </ReviewItem>
      </ReviewSection>
    </section>
  );
}

export function RegulationWizard() {
  const router = useRouter();
  const form = useForm<RegulationFormValues>({
    resolver: zodResolver(regulationFormSchema),
    defaultValues: emptyRegulationForm(),
    shouldFocusError: false,
  });
  const { control, handleSubmit, trigger } = form;

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [validated, setValidated] = useState(0);
  const [staged, setStaged] = useState<StagedFile[]>([]);
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
        goToStep(s, firstInvalidRegulationFieldId(pickErrors(form, fields)));
        return;
      }
    }
    setValidated((v) => Math.max(v, target - 1));
    goToStep(target);
  };

  const onInvalid = (errors: FieldErrors<RegulationFormValues>) => {
    const first = REGULATION_FIELD_ORDER.find((n) => errors[n]);
    if (first) goToStep(stepOfField(first), firstInvalidRegulationFieldId(errors));
  };

  const onValid = async (values: RegulationFormValues) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setBanner(null);

    try {
      if (createdIdRef.current === null) {
        try {
          const created = await regulationsService.create(toRegulationPayload(values));
          createdIdRef.current = created.id;
        } catch (e) {
          busyRef.current = false;
          setSubmitting(false);
          if (!mounted.current) return;
          const err = normalizeError(e);
          const { matched, unmatched, focusId } = applyRegulationServerErrors(form, err);
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
      if (staged.length > 0) {
        const { failed } = await uploadStaged(
          staged.map((s) => s.file),
          'legal-regulation',
          id,
        );
        if (failed.length > 0) {
          toast.error(W.uploadFailed(failed.map((s) => s.name).join(', ')));
        }
      }

      if (!mounted.current) return;
      toast.success(WR.created);
      router.push(`/legal/regulations/${id}`);
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

  const handleFilesDropped = (files: File[]) => {
    const newItems = files.map((file) => ({
      id: `staged-${++stagedSeq}`,
      file,
    }));
    setStaged((prev) => [...prev, ...newItems]);
  };

  const handleRemoveStaged = (item: FileItem) => {
    setStaged((prev) => prev.filter((s) => s.id !== item.id));
  };

  const fileListItems: FileItem[] = staged.map((s) => ({
    id: s.id,
    name: s.file.name,
    size: s.file.size,
    type: s.file.type,
    uploadedAt: new Date().toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={WR.title} meta={<p>{lo.legal.wizard.description}</p>} />

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
                <RegulationFormFields form={form} fields={STEP_FIELDS[1]} />
              ) : null}

              {step === 2 ? (
                <RegulationFormFields form={form} fields={STEP_FIELDS[2]} />
              ) : null}

              {step === 3 ? (
                <div className="flex flex-col gap-6">
                  <RegulationFormFields form={form} fields={STEP_FIELDS[3]} />

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-(--text-secondary)">{F.documents}</span>
                    <FileDropzone
                      onFilesSelected={handleFilesDropped}
                      disabled={submitting}
                    />
                    <p className="text-xs text-(--text-muted)">{W.stagedHint}</p>
                    {staged.length > 0 ? (
                      <FileList
                        files={fileListItems}
                        onDelete={handleRemoveStaged}
                      />
                    ) : null}
                  </div>

                  <ReviewStep
                    control={control}
                    staged={staged}
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
                      href="/legal"
                      className={cn(buttonVariants({ variant: 'outline' }))}
                      aria-disabled={submitting}
                    >
                      {lo.legal.regulations.form.cancel}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {step < TOTAL_STEPS ? (
                    <Button
                      key="wizard-next-btn"
                      type="button"
                      onClick={() => goTo(step + 1)}
                      className="bg-(--gold) text-(--gold-contrast) hover:bg-(--gold-hover)"
                    >
                      {W.next}
                    </Button>
                  ) : (
                    <Button
                      key="wizard-submit-btn"
                      type="submit"
                      disabled={submitting}
                      className="bg-(--gold) text-(--gold-contrast) hover:bg-(--gold-hover)"
                    >
                      {submitting ? lo.legal.regulations.form.saving : WR.submit}
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
