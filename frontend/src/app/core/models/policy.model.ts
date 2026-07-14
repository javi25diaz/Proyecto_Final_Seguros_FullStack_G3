import { ClientRef, UserRef } from './common.model';

export type InsuranceType = 'auto' | 'home' | 'life' | 'health' | 'travel' | 'other';
export type PolicyStatus = 'draft' | 'active' | 'expired' | 'cancelled';

export interface Policy {
  _id: string;
  policyNumber: string;
  client: ClientRef | string;
  insuranceType: InsuranceType;
  coverage: string;
  premium: number;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  assignedAgent: UserRef | string;
  notes?: string;
  createdBy: UserRef | string;
  createdAt: string;
  updatedAt: string;
}
