import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';

export const ppaSchema = z.object({
  contractNo: z.string().trim().min(1, lo.ppa.validation.contractNoRequired),
  projectName: z.string().trim().min(1, lo.ppa.validation.projectNameRequired),
  developerName: z.string().trim().min(1, lo.ppa.validation.developerRequired),
  energyType: z.enum(['hydro', 'solar', 'wind', 'coal', 'biomass'], {
    message: lo.ppa.validation.energyTypeRequired,
  }),
  capacityMw: z.number().positive(lo.ppa.validation.capacityRequired),
  tariffUsCentPerKwh: z.number().positive(lo.ppa.validation.tariffRequired),
  annualEnergyGwh: z.number().optional().nullable(),
  market: z.enum(['domestic', 'export'], {
    message: lo.ppa.validation.marketRequired,
  }),
  signedDate: z.string().trim().min(1, lo.ppa.validation.signedDateRequired),
  codDate: z.string().trim().min(1, lo.ppa.validation.codDateRequired),
  endDate: z.string().trim().min(1, lo.ppa.validation.endDateRequired),
  termYears: z.number().int().positive(lo.ppa.validation.termYearsRequired),
  status: z.enum([
    'draft',
    'negotiating',
    'pending_cod',
    'active',
    'expiring',
    'expired',
    'terminated',
  ]),
  notes: z.string().optional(),
});

export type PpaFormValues = z.infer<typeof ppaSchema>;
