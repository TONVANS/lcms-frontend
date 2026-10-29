import { describe, expect, it } from 'vitest';
import { endpoints } from './endpoints';

describe('backend endpoints', () => {
  it('has static paths', () => {
    expect(endpoints.auth.login).toBe('/auth/login');
    expect(endpoints.auth.me).toBe('/auth/me');
    expect(endpoints.contracts.list).toBe('/contracts');
    expect(endpoints.contracts.dashboard).toBe('/contracts/dashboard');
    expect(endpoints.contractTypes.dropdown).toBe('/contract-types/dropdown');
    expect(endpoints.legalDocuments.dashboard).toBe('/legal-documents/dashboard');
    expect(endpoints.legalCases.list).toBe('/legal-cases');
    expect(endpoints.powerContracts.projectTypes).toBe('/power-contracts/project-types');
    expect(endpoints.notifications.readAll).toBe('/notifications/read-all');
    expect(endpoints.powerNotifications.list).toBe('/power-notifications');
    expect(endpoints.departments.sync).toBe('/departments/sync');
    expect(endpoints.support.contacts).toBe('/support/contacts');
    expect(endpoints.support.tickets).toBe('/support/tickets');
    expect(endpoints.users.list).toBe('/users');
    expect(endpoints.auditLogs.list).toBe('/audit-logs');
  });

  it('builds id paths and encodes ids', () => {
    expect(endpoints.contracts.detail('a/b')).toBe('/contracts/a%2Fb');
    expect(endpoints.contracts.history('x y')).toBe('/contracts/x%20y/history');
    expect(endpoints.powerContracts.history('1')).toBe('/power-contracts/1/history');
    expect(endpoints.legalCases.detail('?')).toBe('/legal-cases/%3F');
    expect(endpoints.notifications.read('9')).toBe('/notifications/9/read');
    expect(endpoints.powerNotifications.read('9')).toBe('/power-notifications/9/read');
    expect(endpoints.users.hrm('E 1')).toBe('/users/hrm/E%201');
    expect(endpoints.support.ticketAttachment('t/1')).toBe('/support/tickets/t%2F1/attachment');
  });

  it('builds per-module attachment paths', () => {
    expect(endpoints.attachments.list('contracts', 'c1')).toBe('/contracts/c1/attachments');
    expect(endpoints.attachments.upload('legal-cases', 'c/1')).toBe(
      '/legal-cases/c%2F1/attachments',
    );
    expect(endpoints.attachments.preview('legal-documents', 'a1')).toBe(
      '/legal-documents/attachments/a1/preview',
    );
    expect(endpoints.attachments.download('power-contracts', 'a1')).toBe(
      '/power-contracts/attachments/a1/download',
    );
    expect(endpoints.attachments.remove('contracts', 'a 1')).toBe('/contracts/attachments/a%201');
  });
});
