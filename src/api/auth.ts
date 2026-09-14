import {apiFetch} from '@/shared/api/http'
import type {MockUser} from '../mocks/data/users'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthSuccess {
  user: MockUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface TwoFactorRequired {
  requiresTwoFactor: true
  tempToken: string
  method: string
}

export type LoginResponse = AuthSuccess | TwoFactorRequired

export const login = (payload: LoginPayload) =>
  apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

export const verifyTwoFactor = (payload: {tempToken: string; code: string}) =>
  apiFetch<AuthSuccess>('/api/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
