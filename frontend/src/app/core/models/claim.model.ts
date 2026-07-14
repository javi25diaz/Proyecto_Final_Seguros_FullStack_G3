import { ClientRef, IncidentRef, PolicyRef, UserRef } from './common.model';

export type ClaimStatus = 'received' | 'under_analysis' | 'approved' | 'rejected';

export interface Claim {
  _id: string;
  claimNumber: string;
  client: ClientRef | string;
  policy: PolicyRef | string;
  incident: IncidentRef | string;
  claimDate: string;
  status: ClaimStatus;
  amountRequested: number;
  amountApproved?: number;
  description: string;
  documentUrls: string[];
  resolutionNotes?: string;
  handledBy: UserRef | string;
  createdAt: string;
  updatedAt: string;
}
