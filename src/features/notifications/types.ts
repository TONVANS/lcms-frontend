export type NotificationSource = 'contracts' | 'power';

export interface AppNotification {
  id: string;
  source: NotificationSource;
  title: string;
  message: string | null;
  contractId: string | null;
  contractLabel: string | null;
  daysLeft: number | null;
  expirationDate: string | null;
  read: boolean;
  createdAt: string;
}
