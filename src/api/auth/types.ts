type UserRole = 'instructor' | 'client';

type UserStatus = 'active' | 'locked' | 'unverified' | 'password_reset_required';

interface User {
  id: string;
  roles: UserRole[];
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  createdAt: string;
  status: UserStatus;
  twoFactorEnabled: boolean;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface TwoFactorPayload {
  tempToken: string;
  code: string;
}

interface AuthSuccess {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TwoFactorRequired {
  requiresTwoFactor: true;
  tempToken: string;
  method: string;
}

type LoginResponse = AuthSuccess | TwoFactorRequired;

export type {AuthSuccess, LoginPayload, LoginResponse, TwoFactorPayload, TwoFactorRequired, User};
