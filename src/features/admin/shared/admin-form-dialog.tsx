'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType } from 'zod';
import { AlertBanner } from '@/components/shared/alert-banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReturnFocus } from '@/hooks/use-return-focus';
import { adminErrorMessage } from '../use-remote';

export interface FormLabels {
  save: string;
  saving: string;
  cancel: string;
}

interface BodyProps<V extends FieldValues> {
  schema: ZodType<V>;
  defaultValues: V;
  labels: FormLabels;
  submit: (values: V) => Promise<void>;
  onClose: () => void;
  children: (form: UseFormReturn<V>) => ReactNode;
}

function FormBody<V extends FieldValues>({ schema, defaultValues, labels, submit, onClose, children }: BodyProps<V>) {
  const form = useForm<V>({
    resolver: zodResolver(schema as never) as Resolver<V>,
    defaultValues: defaultValues as DefaultValues<V>,
  });
  const [banner, setBanner] = useState<string | null>(null);
  const busy = useRef(false);
  const saving = form.formState.isSubmitting;

  const onValid = async (values: V) => {
    if (busy.current) return;
    busy.current = true;
    setBanner(null);
    try {
      await submit(values);
    } catch (e) {
      setBanner(adminErrorMessage(e));
      return;
    } finally {
      busy.current = false;
    }
    onClose();
  };

  return (
    <form noValidate aria-busy={saving} onSubmit={(e) => void form.handleSubmit(onValid)(e)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">{children(form)}</div>
      {banner ? <AlertBanner tone="rose" title={banner} /> : null}
      <DialogFooter className="flex flex-row items-center justify-end gap-2">
        <Button type="button" variant="ghost" disabled={saving} onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button type="submit" disabled={saving} className="min-w-28 gap-2">
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>{labels.saving}</span>
            </>
          ) : (
            labels.save
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export interface AdminFormDialogProps<V extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Changing the key remounts the form so no value leaks between openings. */
  formKey: string;
  schema: ZodType<V>;
  defaultValues: V;
  labels: FormLabels;
  /** Throw to keep the dialog open and show the server message. */
  submit: (values: V) => Promise<void>;
  children: (form: UseFormReturn<V>) => ReactNode;
}

export function AdminFormDialog<V extends FieldValues>({
  open,
  onOpenChange,
  title,
  formKey,
  schema,
  defaultValues,
  labels,
  submit,
  children,
}: AdminFormDialogProps<V>) {
  const returnFocus = useReturnFocus(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className="max-w-[calc(100%-2rem)] rounded-[26px] border border-[var(--border-glass)] bg-(image:--surface-modal) p-6 shadow-2xl backdrop-blur-[28px] sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[var(--text-strong)]">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        {open ? (
          <FormBody
            key={formKey}
            schema={schema}
            defaultValues={defaultValues}
            labels={labels}
            submit={submit}
            onClose={() => onOpenChange(false)}
          >
            {children}
          </FormBody>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface TextFieldProps<V extends FieldValues> {
  form: UseFormReturn<V>;
  name: FieldPath<V>;
  label: string;
  required?: boolean;
}

export function TextField<V extends FieldValues>({ form, name, label, required }: TextFieldProps<V>) {
  const id = useId();
  const errId = `${id}-err`;
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </Label>
      <Input
        id={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        {...form.register(name)}
      />
      {error ? (
        <p id={errId} className="text-xs text-(--text-error)">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ActiveField<V extends FieldValues>({
  form,
  name,
  label,
}: {
  form: UseFormReturn<V>;
  name: FieldPath<V>;
  label: string;
}) {
  const id = useId();
  const checked = form.watch(name) === true;
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => form.setValue(name, (v === true) as never, { shouldDirty: true })}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
