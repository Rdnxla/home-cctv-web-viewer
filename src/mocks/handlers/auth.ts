import {delay, HttpResponse, http} from 'msw';
import {ApiErrorCode} from '@/shared/api/authErrorCodes';
import type {AuthSuccess, LoginPayload, TwoFactorPayload, TwoFactorRequired, User} from '@/api/auth/types';
import type {MockAccount} from '../db';
import {db} from '../db';

const BASE_URL = '/api/auth';
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const OTP_CODE = '123456';
const failedAttempts = new Map<string, number>();
const lockedUntil = new Map<string, number>();
const rateLimitWindows = new Map<string, RateLimitWindow>();
const pendingTwoFactor = new Map<string, string>();
const activeSessions = new Set<string>();
const refreshTokens = new Set<string>();

const MAX_ATTEMPTS_BEFORE_LOCK = 3;
const LOCK_DURATION_MS = 60_000;
const TEMPORARY_LOCK_MESSAGE = 'Too many failed attempts. Account temporarily locked.';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMITED_RETRY_AFTER_S = 30;

type TokenPrefix = 'reset' | 'mfa' | 'at' | 'rt';

type BodyField = keyof LoginPayload | keyof TwoFactorPayload | 'refreshToken';

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

interface RateLimitWindow {
  count: number;
  start: number;
}

function makeToken(prefix: TokenPrefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

function sanitize(user: MockAccount): User {
  const {password, ...safe} = user;
  return safe;
}

function readString(body: unknown, field: BodyField) {
  if (typeof body !== 'object' || body === null) return '';
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

function resetMockState() {
  failedAttempts.clear();
  lockedUntil.clear();
  rateLimitWindows.clear();
  pendingTwoFactor.clear();
  activeSessions.clear();
  refreshTokens.clear();
}

function issueSession(user: MockAccount) {
  const accessToken = makeToken('at');
  const refreshToken = makeToken('rt');
  activeSessions.add(accessToken);
  refreshTokens.add(refreshToken);
  return HttpResponse.json<AuthSuccess>(
    {
      accessToken,
      expiresIn: 3600,
      refreshToken,
      user: sanitize(user),
    },
    {status: 200}
  );
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return HttpResponse.json(
    {error: ApiErrorCode.rateLimited, message: 'Too many login attempts. Try again later.'},
    {headers: {'Retry-After': String(retryAfterSeconds)}, status: 429}
  );
}

function checkRateLimit(email: string) {
  if (email === 'ratelimited@example.com') return rateLimitedResponse(RATE_LIMITED_RETRY_AFTER_S);

  const now = Date.now();
  const current = rateLimitWindows.get(email);
  if (!current || now - current.start >= RATE_LIMIT_WINDOW_MS) {
    rateLimitWindows.set(email, {count: 1, start: now});
    return null;
  }

  current.count += 1;
  if (current.count <= RATE_LIMIT_MAX_REQUESTS) return null;
  // The window is fixed, not sliding, so the client must wait until it ends.
  return rateLimitedResponse(Math.ceil((current.start + RATE_LIMIT_WINDOW_MS - now) / 1000));
}

function accountLockedResponse(message: string) {
  return HttpResponse.json({error: ApiErrorCode.accountLocked, message}, {status: 423});
}

function isTemporarilyLocked(email: string) {
  const until = lockedUntil.get(email);
  if (until === undefined) return false;
  if (Date.now() < until) return true;
  lockedUntil.delete(email);
  failedAttempts.delete(email);
  return false;
}

function rejectCredentials(email: string) {
  const attempts = (failedAttempts.get(email) ?? 0) + 1;
  failedAttempts.set(email, attempts);
  if (attempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
    lockedUntil.set(email, Date.now() + LOCK_DURATION_MS);
    return accountLockedResponse(TEMPORARY_LOCK_MESSAGE);
  }
  return HttpResponse.json(
    {
      attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCK - attempts,
      error: ApiErrorCode.invalidCredentials,
      message: 'Email or password is incorrect.',
    },
    {status: 401}
  );
}

function handleUserStatus(user: MockAccount) {
  if (user.status === 'unverified') {
    return HttpResponse.json(
      {
        error: ApiErrorCode.emailNotVerified,
        message: 'Please verify your email before logging in.',
      },
      {status: 403}
    );
  }
  if (user.status === 'password_reset_required') {
    return HttpResponse.json(
      {
        error: ApiErrorCode.passwordResetRequired,
        message: 'Your password must be reset before continuing.',
        resetToken: makeToken('reset'),
      },
      {status: 403}
    );
  }
  if (user.twoFactorEnabled) {
    const tempToken = makeToken('mfa');
    pendingTwoFactor.set(tempToken, user.email);
    return HttpResponse.json<TwoFactorRequired>({method: 'totp', requiresTwoFactor: true, tempToken}, {status: 200});
  }
  return issueSession(user);
}

function validateLoginBody(body: unknown) {
  // Lowercased so the lockout and rate-limit counters can't be reset by changing the case of the email.
  const email = readString(body, 'email').trim().toLowerCase();
  const password = readString(body, 'password');
  const fieldErrors: LoginFieldErrors = {};

  if (!email) fieldErrors.email = 'Email is required.';
  else if (!REGEX_EMAIL.test(email)) fieldErrors.email = 'Email is invalid.';

  if (!password) fieldErrors.password = 'Password is required.';
  else if (password.length < 8) fieldErrors.password = 'Password must be at least 8 characters.';

  return {
    email,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
    password,
  };
}

async function simulateServerFailure(email: string) {
  if (email === 'error500@example.com') {
    return HttpResponse.json(
      {
        error: ApiErrorCode.internalError,
        message: 'Something went wrong. Please try again.',
      },
      {status: 500}
    );
  }
  if (email === 'maintenance@example.com') {
    await delay(200);
    return HttpResponse.json(
      {error: ApiErrorCode.serviceUnavailable, message: 'Service is under maintenance.'},
      {status: 503}
    );
  }
  if (email === 'timeout@example.com') await delay('infinite');
  return null;
}

const authHandlers = [
  http.post(`${BASE_URL}/login`, async ({request}) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        {error: ApiErrorCode.invalidBody, message: 'Request body must be valid JSON.'},
        {status: 400}
      );
    }

    const {email, password, isValid, fieldErrors} = validateLoginBody(body);
    if (!isValid) {
      return HttpResponse.json(
        {error: ApiErrorCode.validationError, fieldErrors, message: 'Some fields are invalid.'},
        {status: 422}
      );
    }

    const failureResponse = await simulateServerFailure(email);
    if (failureResponse) return failureResponse;

    const rateLimitResponse = checkRateLimit(email);
    if (rateLimitResponse) return rateLimitResponse;

    const user = db.accounts.find(account => account.email.toLowerCase() === email);
    if (user?.status === 'locked') return accountLockedResponse('This account has been locked. Contact support.');
    if (isTemporarilyLocked(email)) return accountLockedResponse(TEMPORARY_LOCK_MESSAGE);
    if (!user || user.password !== password) return rejectCredentials(email);
    failedAttempts.delete(email);

    return handleUserStatus(user);
  }),

  http.post(`${BASE_URL}/login/2fa`, async ({request}) => {
    const body: unknown = await request.json();
    const tempToken = readString(body, 'tempToken');
    const email = pendingTwoFactor.get(tempToken);
    const user = db.accounts.find(account => account.email === email);

    if (!user) {
      return HttpResponse.json(
        {error: ApiErrorCode.invalidSession, message: 'Two-factor session expired or invalid.'},
        {status: 401}
      );
    }

    if (readString(body, 'code') !== OTP_CODE) {
      return HttpResponse.json(
        {error: ApiErrorCode.invalidCode, message: 'Incorrect verification code.'},
        {status: 401}
      );
    }

    pendingTwoFactor.delete(tempToken);
    return issueSession(user);
  }),

  http.post(`${BASE_URL}/refresh`, async ({request}) => {
    const body: unknown = await request.json();

    if (!refreshTokens.has(readString(body, 'refreshToken'))) {
      return HttpResponse.json(
        {
          error: ApiErrorCode.invalidRefreshToken,
          message: 'Session expired. Please log in again.',
        },
        {status: 401}
      );
    }

    const accessToken = makeToken('at');
    activeSessions.add(accessToken);
    return HttpResponse.json({accessToken, expiresIn: 3600}, {status: 200});
  }),

  http.get(`${BASE_URL}/me`, ({request}) => {
    const auth = request.headers.get('authorization') ?? '';
    const token = auth.replace('Bearer ', '');

    if (!token || !activeSessions.has(token)) {
      return HttpResponse.json({error: ApiErrorCode.unauthenticated, message: 'Not logged in.'}, {status: 401});
    }

    return HttpResponse.json({status: 'authenticated'}, {status: 200});
  }),

  http.post(`${BASE_URL}/logout`, ({request}) => {
    const auth = request.headers.get('authorization') ?? '';
    activeSessions.delete(auth.replace('Bearer ', ''));
    return new HttpResponse(null, {status: 204});
  }),
];

export {authHandlers, resetMockState};
