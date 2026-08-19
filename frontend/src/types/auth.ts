export type UserRole = 'CLIENT' | 'ORGANIZER' | 'GATE_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}
