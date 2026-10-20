export {
  GC_CONTRACT_TYPES,
  GC_STATUSES,
  GC_CURRENCIES,
  type GcContractType,
  type GcStatus,
  type GcEquity,
  type GeneralContract,
} from './types';
export { deriveGcStatus, GC_STATUS_TONE, GC_EXPIRING_DAYS } from './lib/derive-status';
export { buildGcAlerts, GC_ALERT_DAYS } from './lib/alerts';
export { suggestTermText } from './lib/term';
export {
  gcFormSchema,
  emptyGcForm,
  toGcPayload,
  fromGcContract,
  type GcFormValues,
  type GcContractInput,
} from './schemas/gc.schema';
export { gcService, type GcListQuery, type GcDashboard } from './api/gc.service';
