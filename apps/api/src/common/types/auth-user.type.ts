import { Role } from '@ethio/database';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
