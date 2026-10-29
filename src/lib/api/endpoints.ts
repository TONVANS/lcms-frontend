import type { AttachmentModule } from '@/types/domain';

const e = encodeURIComponent;

export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },

  // ---- Backend map (Phase 5). Legacy keys below are removed by the feature tasks. ----
  contracts: {
    list: '/contracts',
    detail: (id: string) => `/contracts/${e(id)}`,
    dashboard: '/contracts/dashboard',
    history: (id: string) => `/contracts/${e(id)}/history`,
  },
  contractTypes: {
    list: '/contract-types',
    dropdown: '/contract-types/dropdown',
    detail: (id: string) => `/contract-types/${e(id)}`,
  },
  legalDocuments: {
    list: '/legal-documents',
    detail: (id: string) => `/legal-documents/${e(id)}`,
    dashboard: '/legal-documents/dashboard',
  },
  legalCases: {
    list: '/legal-cases',
    detail: (id: string) => `/legal-cases/${e(id)}`,
    dashboard: '/legal-cases/dashboard',
  },
  powerContracts: {
    list: '/power-contracts',
    detail: (id: string) => `/power-contracts/${e(id)}`,
    dashboard: '/power-contracts/dashboard',
    history: (id: string) => `/power-contracts/${e(id)}/history`,
    projectTypes: '/power-contracts/project-types',
  },
  attachments: {
    list: (m: AttachmentModule, id: string) => `/${m}/${e(id)}/attachments`,
    upload: (m: AttachmentModule, id: string) => `/${m}/${e(id)}/attachments`,
    preview: (m: AttachmentModule, attId: string) => `/${m}/attachments/${e(attId)}/preview`,
    download: (m: AttachmentModule, attId: string) => `/${m}/attachments/${e(attId)}/download`,
    remove: (m: AttachmentModule, attId: string) => `/${m}/attachments/${e(attId)}`,
  },
  notifications: {
    list: '/notifications',
    read: (id: string) => `/notifications/${e(id)}/read`,
    readAll: '/notifications/read-all',
  },
  powerNotifications: {
    list: '/power-notifications',
    read: (id: string) => `/power-notifications/${e(id)}/read`,
    readAll: '/power-notifications/read-all',
  },
  departments: {
    list: '/departments',
    dropdown: '/departments/dropdown',
    detail: (id: string) => `/departments/${e(id)}`,
    sync: '/departments/sync',
  },
  support: {
    contacts: '/support/contacts',
    contact: (id: string) => `/support/contacts/${e(id)}`,
    tickets: '/support/tickets',
    ticket: (id: string) => `/support/tickets/${e(id)}`,
    ticketAttachment: (id: string) => `/support/tickets/${e(id)}/attachment`,
  },
  users: {
    list: '/users',
    detail: (id: string) => `/users/${e(id)}`,
    hrm: (empCode: string) => `/users/hrm/${e(empCode)}`,
  },
  auditLogs: {
    list: '/audit-logs',
  },

  // ---- Legacy (pre-backend) keys ----
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
} as const;
