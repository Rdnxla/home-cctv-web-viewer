import {apiFetch} from '@/shared/api/http';
import type {
  AuthSuccess,
  LoginPayload,
  LoginResponse,
} from './auth.types';

function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

function verifyTwoFactor(payload: {tempToken: string; code: string}) {
  return apiFetch<AuthSuccess>('/api/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export {
  login,
  verifyTwoFactor,
}