'use client';

import { toast } from 'sonner';
import { useLookupsStore } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { adminService } from '../admin.service';
import {
  departmentSchema,
  emptyDepartmentForm,
  toDepartmentPayload,
  type DepartmentFormValues,
} from '../admin.schema';
import { ActiveField, AdminFormDialog, TextField } from '../shared/admin-form-dialog';
import type { DepartmentRecord } from '../types';

const L = lo.departments;

export interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: DepartmentRecord;
  onSaved: () => void;
}

export function DepartmentFormDialog({ open, onOpenChange, item, onSaved }: DepartmentFormDialogProps) {
  const defaults: DepartmentFormValues = item
    ? { name: item.name, code: item.code ?? '', isActive: item.isActive }
    : emptyDepartmentForm();

  const submit = async (values: DepartmentFormValues) => {
    const payload = toDepartmentPayload(values);
    if (item) await adminService.departments.update(item.id, payload);
    else await adminService.departments.create(payload);
    void useLookupsStore.getState().load('departments', true);
    toast.success(L.form.saved);
    onSaved();
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? L.form.editTitle : L.form.createTitle}
      formKey={item?.id ?? 'new'}
      schema={departmentSchema}
      defaultValues={defaults}
      labels={L.form}
      submit={submit}
    >
      {(form) => (
        <>
          <TextField form={form} name="name" label={L.form.name} required />
          <TextField form={form} name="code" label={L.form.code} />
          <ActiveField form={form} name="isActive" label={L.form.isActive} />
        </>
      )}
    </AdminFormDialog>
  );
}
