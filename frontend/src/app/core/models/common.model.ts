export interface UserRef {
  _id: string;
  name: string;
  email: string;
}

export interface ClientRef {
  _id: string;
  name: string;
  identification?: string;
  status?: string;
}

export interface PolicyRef {
  _id: string;
  policyNumber: string;
}

export interface IncidentRef {
  _id: string;
  incidentNumber: string;
}
