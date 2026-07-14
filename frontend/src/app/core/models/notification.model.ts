import { ClientRef, UserRef } from './common.model';

export type NotificationType = 'policy' | 'payment' | 'incident' | 'claim' | 'system';
export type RelatedEntityType = 'Policy' | 'Payment' | 'Incident' | 'Claim' | 'User';

export interface AppNotification {
  _id: string;
  message: string;
  type: NotificationType;
  recipientUser?: UserRef | string;
  client?: ClientRef | string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  isRead: boolean;
  isAutomatic: boolean;
  createdBy?: UserRef | string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
