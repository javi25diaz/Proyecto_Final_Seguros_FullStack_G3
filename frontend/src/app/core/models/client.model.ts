import { UserRef } from './common.model';
import { Policy } from './policy.model';
import { Payment } from './payment.model';
import { Incident } from './incident.model';
import { Claim } from './claim.model';
import { AppNotification } from './notification.model';

export type ClientStatus = 'active' | 'inactive';

export interface Client {
  _id: string;
  name: string;
  identification: string;
  phone: string;
  email: string;
  address: string;
  status: ClientStatus;
  assignedAgent: UserRef | string;
  notes?: string;
  createdBy: UserRef | string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientHistory {
  client: Client;
  policies: Policy[];
  payments: Payment[];
  incidents: Incident[];
  claims: Claim[];
  notifications: AppNotification[];
  totals: {
    policies: number;
    activePolicies: number;
    totalPaid: number;
    openIncidents: number;
    pendingClaims: number;
  };
}
