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
