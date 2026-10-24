export const endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
  },
  home: {
    summary: '/home/summary',
  },
  alerts: {
    list: '/alerts',
    read: (id: string) => `/alerts/${id}/read`,
  },
  ppa: {
    list: '/ppa/contracts',
    detail: (id: string) => `/ppa/contracts/${id}`,
    dashboard: '/ppa/dashboard',
    history: (id: string) => `/ppa/contracts/${id}/history`,
  },
  gc: {
    list: '/contracts',
    detail: (id: string) => `/contracts/${id}`,
    dashboard: '/contracts/dashboard',
  },
  legal: {
    regulations: '/legal/regulations',
    regulation: (id: string) => `/legal/regulations/${encodeURIComponent(id)}`,
    cases: '/legal/cases',
    case: (id: string) => `/legal/cases/${encodeURIComponent(id)}`,
    dashboard: '/legal/dashboard',
  },
  documents: {
    list: (entityType: string, entityId: string) => `/documents?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
    upload: '/documents',
    detail: (id: string) => `/documents/${id}`,
    download: (id: string) => `/documents/${id}/download`,
  },
  lookups: {
    departments: '/lookups/departments',
  },
} as const;
