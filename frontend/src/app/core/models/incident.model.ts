import { ClientRef, PolicyRef, UserRef } from './common.model';

export type IncidentStatus = 'reported' | 'under_review' | 'closed';

export interface Incident {
  _id: string;
  incidentNumber: string;
  client: ClientRef | string;
  policy: PolicyRef | string;
  description: string;
  eventDate: string;
  evidenceUrl?: string;
  status: IncidentStatus;
  reportedBy: UserRef | string;
  createdAt: string;
  updatedAt: string;
}
