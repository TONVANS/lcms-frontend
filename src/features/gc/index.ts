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
