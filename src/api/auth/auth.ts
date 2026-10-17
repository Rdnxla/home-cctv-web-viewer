import {apiFetch} from '@/shared/api/http';
import type {AuthSuccess, LoginPayload, LoginResponse} from './auth.types';

function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

function verifyTwoFactor(payload: {tempToken: string; code: string}) {
  return apiFetch<AuthSuccess>('/api/auth/login/2fa', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export {login, verifyTwoFactor};
