import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';
import type { ContractStatus } from '@/types/domain';
import { durationTextToMonths, monthsToDurationText } from '../lib/format';
import {
  POWER_CAPACITY_UNITS,
  POWER_CONTRACT_TYPES,
  POWER_STATUSES,
  type PowerContract,
  type PowerContractType,
} from '../types';

const v = lo.ppa.validation;

const dateField = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, v.dateInvalid)]);

const numberField = (message: string) =>
  z
    .number({ message })
    .nullable()
    .refine((n) => n === null || Number.isFinite(n), { message });

/** One schema = CreatePowerContractDto; shared by the dialog and the wizard. */
export const powerContractSchema = z
  .object({
    contractType: z.enum(POWER_CONTRACT_TYPES, { message: v.contractTypeRequired }),
    contractNumber: z.string().trim(),
    projectName: z.string().trim().min(1, v.projectNameRequired),
    projectTypeOrCustomer: z.string().trim().min(1, v.projectTypeOrCustomerRequired),
    status: z.enum(POWER_STATUSES).optional(),
    durationText: z.string().trim(),
    durationMonths: numberField(v.numberInvalid).refine((n) => n === null || (Number.isInteger(n) && n >= 0), {
      message: v.durationMonthsInvalid,
    }),
    signedDate: dateField,
    effectiveDate: dateField,
    expirationDate: dateField,
    installedCapacity: z.string().trim(),
    capacityValue: numberField(v.numberInvalid).refine((n) => n === null || n >= 0, {
      message: v.capacityNegative,
    }),
    capacityUnit: z.enum(POWER_CAPACITY_UNITS),
    projectLocation: z.string().trim(),
    tariff: z.string().trim(),
    tariffValue: numberField(v.numberInvalid).refine((n) => n === null || n >= 0, {
      message: v.tariffNegative,
    }),
    tariffCurrency: z.enum(['LAK', 'USD', 'CNY']),
    additionalDetails: z.string().trim(),
    notifyDaysBefore: z
      .number({ message: v.notifyInvalid })
      .int(v.notifyInvalid)
      .min(0, v.notifyInvalid),
  })
  .superRefine((val, ctx) => {
    if (val.effectiveDate && val.expirationDate && val.expirationDate < val.effectiveDate) {
      ctx.addIssue({ code: 'custom', path: ['expirationDate'], message: v.expirationBeforeEffective });
    }
  });

export type PowerFormValues = z.infer<typeof powerContractSchema>;
export type PowerFormField = keyof PowerFormValues;

export function emptyPowerForm(type: PowerContractType = 'PURCHASE'): PowerFormValues {
  return {
    contractType: type,
    contractNumber: '',
    projectName: '',
    projectTypeOrCustomer: '',
    status: 'DRAFT',
    durationText: '',
    durationMonths: null,
    signedDate: '',
    effectiveDate: '',
    expirationDate: '',
    installedCapacity: '',
    capacityValue: null,
    capacityUnit: 'MW',
    projectLocation: '',
    tariff: '',
    tariffValue: null,
    tariffCurrency: type === 'SALE' ? 'LAK' : 'USD',
    additionalDetails: '',
    notifyDaysBefore: 60,
  };
}

/** Edit form: composed texts start empty so they are recomposed from value + unit/currency. */
export function fromPowerContract(c: PowerContract): PowerFormValues {
  return {
    contractType: c.contractType,
    contractNumber: c.contractNumber,
    projectName: c.projectName,
    projectTypeOrCustomer: c.projectTypeOrCustomer,
    status: c.status,
    durationText: c.durationText ?? '',
    durationMonths: c.durationMonths,
    signedDate: c.signedDate ?? '',
    effectiveDate: c.effectiveDate ?? '',
    expirationDate: c.expirationDate ?? '',
    installedCapacity: c.installedCapacity ?? '',
    capacityValue: c.capacityValue,
    capacityUnit: c.capacityUnit ?? 'MW',
    projectLocation: c.projectLocation ?? '',
    tariff: c.tariff ?? '',
    tariffValue: c.tariffValue,
    tariffCurrency: c.tariffCurrency ?? (c.contractType === 'SALE' ? 'LAK' : 'USD'),
    additionalDetails: c.additionalDetails ?? '',
    notifyDaysBefore: c.notifyDaysBefore ?? 60,
  };
}

/** Request body of POST /power-contracts (a subset of it for PATCH). Empty values are omitted. */
export interface PowerContractPayload {
  contractType?: PowerFormValues['contractType'];
  contractNumber?: string;
  projectName?: string;
  projectTypeOrCustomer?: string;
  status?: ContractStatus;
  durationText?: string;
  durationMonths?: number;
  signedDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  installedCapacity?: string;
  capacityValue?: number;
  capacityUnit?: PowerFormValues['capacityUnit'];
  projectLocation?: string;
  tariff?: string;
  tariffValue?: number;
  tariffCurrency?: PowerFormValues['tariffCurrency'];
  additionalDetails?: string;
  notifyDaysBefore?: number;
}

export function toPowerContractPayload(f: PowerFormValues): PowerContractPayload {
  const out: PowerContractPayload = {
    contractType: f.contractType,
    projectName: f.projectName.trim(),
    projectTypeOrCustomer: f.projectTypeOrCustomer.trim(),
  };
  out.status = f.status ?? 'DRAFT';
  const text = (key: 'contractNumber' | 'projectLocation' | 'additionalDetails') => {
    const s = f[key].trim();
    if (s) out[key] = s;
  };
  text('contractNumber');

  // Handle duration: if durationMonths is present but durationText is empty, auto-generate durationText (and vice versa)
  const dMonths = f.durationMonths ?? durationTextToMonths(f.durationText);
  const dText = f.durationText.trim() || (dMonths !== null ? monthsToDurationText(dMonths) : '');
  if (dText) out.durationText = dText;
  if (dMonths !== null) out.durationMonths = dMonths;

  for (const key of ['signedDate', 'effectiveDate', 'expirationDate'] as const) {
    if (f[key]) out[key] = f[key];
  }
  if (f.capacityValue !== null) {
    out.capacityValue = f.capacityValue;
    out.capacityUnit = f.capacityUnit;
    out.installedCapacity = f.installedCapacity.trim() || `${f.capacityValue} ${f.capacityUnit}`;
  } else if (f.installedCapacity.trim()) {
    out.installedCapacity = f.installedCapacity.trim();
  }
  text('projectLocation');
  if (f.tariffValue !== null) {
    out.tariffValue = f.tariffValue;
    out.tariffCurrency = f.tariffCurrency;
    out.tariff = f.tariff.trim() || `${f.tariffValue} ${f.tariffCurrency}/kWh`;
  } else if (f.tariff.trim()) {
    out.tariff = f.tariff.trim();
  }
  text('additionalDetails');
  out.notifyDaysBefore = f.notifyDaysBefore ?? 60;
  return out;
}

/**
 * PATCH body: only the fields that differ from `original`. A composed installedCapacity / tariff
 * is only sent when its value or unit/currency changed, so hand-written texts are not overwritten.
 */
export function diffPayload(next: PowerContractPayload, original: PowerContract): PowerContractPayload {
  const out: Record<string, unknown> = {};
  const orig = original as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(next)) {
    if (value !== orig[key]) out[key] = value;
  }
  if (!('capacityValue' in out) && !('capacityUnit' in out)) delete out.installedCapacity;
  if (!('tariffValue' in out) && !('tariffCurrency' in out)) delete out.tariff;
  return out as PowerContractPayload;
}
