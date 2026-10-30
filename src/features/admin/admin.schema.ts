import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';

export const contractTypeSchema = z.object({
  nameLo: z.string().trim().min(1, lo.contractTypes.form.required),
  nameEn: z.string().trim(),
  isActive: z.boolean(),
});
export type ContractTypeFormValues = z.infer<typeof contractTypeSchema>;

export const departmentSchema = z.object({
  name: z.string().trim().min(1, lo.departments.form.required),
  code: z.string().trim(),
  isActive: z.boolean(),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export interface ContractTypePayload {
  nameLo: string;
  nameEn?: string;
  isActive: boolean;
}
export interface DepartmentPayload {
  name: string;
  code?: string;
  isActive: boolean;
}

export const emptyContractTypeForm = (): ContractTypeFormValues => ({ nameLo: '', nameEn: '', isActive: true });
export const emptyDepartmentForm = (): DepartmentFormValues => ({ name: '', code: '', isActive: true });

export function toContractTypePayload(v: ContractTypeFormValues): ContractTypePayload {
  const nameEn = v.nameEn.trim();
  return {
    nameLo: v.nameLo.trim(),
    ...(nameEn ? { nameEn } : {}),
    isActive: v.isActive,
  };
}

export function toDepartmentPayload(v: DepartmentFormValues): DepartmentPayload {
  const code = v.code.trim();
  return { name: v.name.trim(), ...(code ? { code } : {}), isActive: v.isActive };
}
