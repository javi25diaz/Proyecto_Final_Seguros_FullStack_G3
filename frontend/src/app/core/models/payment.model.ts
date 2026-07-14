import { ClientRef, PolicyRef, UserRef } from './common.model';

export type PaymentStatus = 'pending' | 'paid' | 'reversed';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface Payment {
  _id: string;
  receiptNumber: string;
  client: ClientRef | string;
  policy: PolicyRef | string;
  amount: number;
  paymentDate: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  registeredBy: UserRef | string;
  createdAt: string;
  updatedAt: string;
}
