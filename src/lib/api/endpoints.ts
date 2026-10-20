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
  lookups: {
    departments: '/lookups/departments',
  },
} as const;
