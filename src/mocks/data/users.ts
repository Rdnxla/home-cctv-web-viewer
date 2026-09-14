// src/mocks/data/users.ts
// Fixture "accounts" the mock server checks credentials against.
// Each one is wired to trigger a specific login corner case.

export interface MockUser {
  id: string
  email: string
  password: string
  name: string
  role: 'user' | 'admin'
  status: 'active' | 'locked' | 'unverified' | 'password_reset_required'
  twoFactorEnabled: boolean
}

export const users: MockUser[] = [
  {
    id: 'usr_001',
    email: 'ok@example.com',
    password: 'Password123!',
    name: 'Alex Ok',
    role: 'user',
    status: 'active',
    twoFactorEnabled: false
  },
  {
    id: 'usr_002',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    name: 'Ada Admin',
    role: 'admin',
    status: 'active',
    twoFactorEnabled: false
  },
  {
    id: 'usr_003',
    email: '2fa@example.com',
    password: 'Password123!',
    name: 'Tia TwoFactor',
    role: 'user',
    status: 'active',
    twoFactorEnabled: true
  },
  {
    id: 'usr_004',
    email: 'locked@example.com',
    password: 'Password123!',
    name: 'Lex Locked',
    role: 'user',
    status: 'locked',
    twoFactorEnabled: false
  },
  {
    id: 'usr_005',
    email: 'unverified@example.com',
    password: 'Password123!',
    name: 'Uma Unverified',
    role: 'user',
    status: 'unverified',
    twoFactorEnabled: false
  },
  {
    id: 'usr_006',
    email: 'resetme@example.com',
    password: 'Password123!',
    name: 'Rio Reset',
    role: 'user',
    status: 'password_reset_required',
    twoFactorEnabled: false
  },
  {
    id: 'usr_trigger_500',
    email: 'error500@example.com',
    password: 'Password123!',
    name: 'trigger',
    role: 'user',
    status: 'active',
    twoFactorEnabled: false
  },
  {
    id: 'usr_trigger_timeout',
    email: 'timeout@example.com',
    password: 'Password123!',
    name: 'trigger',
    role: 'user',
    status: 'active',
    twoFactorEnabled: false
  },
  {
    id: 'usr_trigger_ratelimit',
    email: 'ratelimited@example.com',
    password: 'Password123!',
    name: 'trigger',
    role: 'user',
    status: 'active',
    twoFactorEnabled: false
  }
]

export const OTP_CODE = '123456'
