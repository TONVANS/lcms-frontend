// Phase 5 replaces this with the /lookups/departments endpoint.
export const LEGAL_UNITS = [
  'edl_office',
  'personnel',
  'legal_contract',
  'inspection',
  'accounting',
  'ict',
  'edl_institute',
  'business_planning',
  'grid_north',
  'grid_central',
  'grid_south',
  'project_management',
] as const;
export type LegalUnit = (typeof LEGAL_UNITS)[number];

export const LEGAL_PAGE_SIZES = [10, 25, 50, 100] as const;
