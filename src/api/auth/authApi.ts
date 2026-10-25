import {apiFetch} from '@/shared/api/http';
import type {AuthSuccess, LoginPayload, LoginResponse, TwoFactorPayload} from './types';

function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

function verifyTwoFactor(payload: TwoFactorPayload) {
  return apiFetch<AuthSuccess>('/api/auth/login/2fa', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export {login, verifyTwoFactor};
