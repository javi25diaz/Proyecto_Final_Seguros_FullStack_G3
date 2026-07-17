export type UserRole = 'guest' | 'user' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  expiresIn: string;
  user: User;
}

export interface UserDependencyCounts {
  assignedClients: number;
  assignedPolicies: number;
  recipientNotifications: number;
  createdClients: number;
  createdPolicies: number;
  createdNotifications: number;
  handledClaims: number;
  registeredPayments: number;
  reportedIncidents: number;
}

export interface UserDependencyBreakdown {
  reassignable: Pick<UserDependencyCounts, 'assignedClients' | 'assignedPolicies' | 'recipientNotifications'>;
  blocking: Pick<
    UserDependencyCounts,
    'createdClients' | 'createdPolicies' | 'createdNotifications' | 'handledClaims' | 'registeredPayments' | 'reportedIncidents'
  >;
}

export interface UserDependenciesSnapshot {
  user: User;
  dependencies: UserDependencyCounts;
  breakdown: UserDependencyBreakdown;
  reassignableCount: number;
  blockingCount: number;
  totalDependencies: number;
  canDelete: boolean;
}

export interface UserReassignResponse {
  sourceUser: User;
  replacementUser: User;
  updated: {
    clients: number;
    policies: number;
    notifications: number;
  };
  totalUpdated: number;
  remainingDependencies: UserDependenciesSnapshot;
  canDeleteSourceUser: boolean;
}
