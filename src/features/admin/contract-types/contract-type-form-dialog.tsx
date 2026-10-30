'use client';

import { toast } from 'sonner';
import { useLookupsStore } from '@/features/lookups';
import { lo } from '@/lib/i18n/lo';
import { adminService } from '../admin.service';
import {
  contractTypeSchema,
  emptyContractTypeForm,
  toContractTypePayload,
  type ContractTypeFormValues,
} from '../admin.schema';
import { ActiveField, AdminFormDialog, TextField } from '../shared/admin-form-dialog';
import type { ContractType } from '../types';

const L = lo.contractTypes;

export interface ContractTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ContractType;
  onSaved: () => void;
}

export function ContractTypeFormDialog({ open, onOpenChange, item, onSaved }: ContractTypeFormDialogProps) {
  const defaults: ContractTypeFormValues = item
    ? { nameLo: item.nameLo, nameEn: item.nameEn ?? '', isActive: item.isActive }
    : emptyContractTypeForm();

  const submit = async (values: ContractTypeFormValues) => {
    const payload = toContractTypePayload(values);
    if (item) await adminService.contractTypes.update(item.id, payload);
    else await adminService.contractTypes.create(payload);
    void useLookupsStore.getState().load('contractTypes', true);
    toast.success(L.form.saved);
    onSaved();
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? L.form.editTitle : L.form.createTitle}
      formKey={item?.id ?? 'new'}
      schema={contractTypeSchema}
      defaultValues={defaults}
      labels={L.form}
      submit={submit}
    >
      {(form) => (
        <>
          <TextField form={form} name="nameLo" label={L.form.nameLo} required />
          <TextField form={form} name="nameEn" label={L.form.nameEn} />
          <ActiveField form={form} name="isActive" label={L.form.isActive} />
        </>
      )}
    </AdminFormDialog>
  );
}
