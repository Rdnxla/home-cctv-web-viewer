import { delay, http, HttpResponse } from 'msw';
import { users, OTP_CODE, type MockUser } from '../data/users';
import { makeToken } from '../../shared/utils/auth';

const BASE_URL = '/api/auth';
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const failedAttempts = new Map<string, number>();      // email -> count
const rateLimitWindow = new Map<string, number>();      // email -> unix ms of window start
const pendingTwoFactor = new Map<string, string>();      // tempToken -> email
const activeSessions = new Set<string>();                // bearer tokens

const MAX_ATTEMPTS_BEFORE_LOCK = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function sanitize(user: MockUser) {
  const { password, ...safe } = user;
  return safe;
}

export function resetMockState() {
  failedAttempts.clear();
  rateLimitWindow.clear();
  pendingTwoFactor.clear();
  activeSessions.clear();
}

// Проверка лимитов запросов
function checkRateLimit(email: string): { isLimited: boolean; response?: Response } {
  const now = Date.now();
  const windowStart = rateLimitWindow.get(email);
  
  if (email === 'ratelimited@example.com' || (windowStart && now - windowStart < RATE_LIMIT_WINDOW_MS)) {
    const attempts = (failedAttempts.get(`rl_${email}`) ?? 0) + 1;
    failedAttempts.set(`rl_${email}`, attempts);
    if (email === 'ratelimited@example.com' || attempts > RATE_LIMIT_MAX_REQUESTS) {
      return { isLimited: true, response: HttpResponse.json(
        { error: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': '30' } }
      )};
    }
  } else {
    rateLimitWindow.set(email, now);
    failedAttempts.set(`rl_${email}`, 1);
  }
  return { isLimited: false };
}

// Проверка пароля и блокировки аккаунта
function verifyCredentials(user: MockUser | undefined, email: string, password?: string): Response | null {
  if (user?.status === 'locked') {
    return HttpResponse.json({ error: 'ACCOUNT_LOCKED', message: 'This account has been locked. Contact support.' }, { status: 423 });
  }
  if (!user || user.password !== password) {
    const attempts = (failedAttempts.get(email) ?? 0) + 1;
    failedAttempts.set(email, attempts);
    if (attempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
      return HttpResponse.json({ error: 'ACCOUNT_LOCKED', message: 'Too many failed attempts. Account temporarily locked.' }, { status: 423 });
    }
    return HttpResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.', attemptsRemaining: MAX_ATTEMPTS_BEFORE_LOCK - attempts }, { status: 401 });
  }
  failedAttempts.delete(email);
  return null;
}

// Проверка специфичных статусов пользователя (MFA, Reset, Verification)
function handleUserStatus(user: MockUser): Response {
  if (user.status === 'unverified') {
    return HttpResponse.json({ error: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' }, { status: 403 });
  }
  if (user.status === 'password_reset_required') {
    return HttpResponse.json({ error: 'PASSWORD_RESET_REQUIRED', message: 'Your password must be reset before continuing.', resetToken: makeToken('reset') }, { status: 403 });
  }
  if (user.twoFactorEnabled) {
    const tempToken = makeToken('mfa');
    pendingTwoFactor.set(tempToken, user.email);
    return HttpResponse.json({ requiresTwoFactor: true, tempToken, method: 'totp' }, { status: 200 });
  }
  const accessToken = makeToken('at');
  activeSessions.add(accessToken);
  return HttpResponse.json({ user: sanitize(user), accessToken, refreshToken: makeToken('rt'), expiresIn: 3600 }, { status: 200 });
}

// Валидация полей запроса
function validateLoginBody(body: Record<string, string | undefined>) {
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';
  const fieldErrors: Record<string, string> = {};

  if (!email) fieldErrors.email = 'Email is required.';
  else if (!REGEX_EMAIL.test(email)) fieldErrors.email = 'Email is invalid.';
  
  if (!password) fieldErrors.password = 'Password is required.';
  else if (password.length < 8) fieldErrors.password = 'Password must be at least 8 characters.';

  return { email, password, isValid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

// Итоговый обработчик
export const handlers = [
  http.post(`${BASE_URL}/login`, async ({ request }) => {
    let body: Record<string, string | undefined>;
    try {
      body = await request.json() as Record<string, string | undefined>;
    } catch {
      return HttpResponse.json({ error: 'INVALID_BODY', message: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const { email, password, isValid, fieldErrors } = validateLoginBody(body);
    if (!isValid) return HttpResponse.json({ error: 'VALIDATION_ERROR', fieldErrors }, { status: 422 });

    if (email === 'error500@example.com') {
      return HttpResponse.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
    if (email === 'timeout@example.com') await delay('infinite');

    const rateLimit = checkRateLimit(email);
    if (rateLimit.isLimited) return rateLimit.response;

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    const credentialsErrorResponse = verifyCredentials(user, email, password);
    if (credentialsErrorResponse) return credentialsErrorResponse;

    return handleUserStatus(user as MockUser);
  }),

  // POST /api/auth/login/2fa
  http.post(`${BASE_URL}/login/2fa`, async ({ request }) => {
    const { tempToken, code } = (await request.json()) as { tempToken?: string; code?: string };
  
    if (!tempToken || !pendingTwoFactor.has(tempToken)) {
      return HttpResponse.json(
        { error: 'INVALID_SESSION', message: 'Two-factor session expired or invalid.' },
        { status: 401 },
      );
    }
  
    if (code !== OTP_CODE) {
      return HttpResponse.json(
        { error: 'INVALID_CODE', message: 'Incorrect verification code.' },
        { status: 401 },
      );
    }
  
    const email = pendingTwoFactor.get(tempToken);
    pendingTwoFactor.delete(tempToken);
    const user = users.find((u) => u.email === email);
  
    const accessToken = makeToken('at');
    activeSessions.add(accessToken);
    return HttpResponse.json(
      {
        user: sanitize(user as MockUser),
        accessToken,
        refreshToken: makeToken('rt'),
        expiresIn: 3600,
      },
      { status: 200 },
    );
  }),

  // POST /api/auth/refresh — silent token refresh
  http.post(`${BASE_URL}/refresh`, async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken?: string };

    if (!refreshToken?.startsWith('rt_')) {
      return HttpResponse.json(
        { error: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Please log in again.' },
        { status: 401 },
      );
    }

    const accessToken = makeToken('at');
    activeSessions.add(accessToken);
    return HttpResponse.json({ accessToken, expiresIn: 3600 }, { status: 200 });
  }),

  // GET /api/auth/me — used by the app to check "am I logged in"
  http.get(`${BASE_URL}/me`, ({ request }) => {
    const auth = request.headers.get('authorization') ?? '';
    const token = auth.replace('Bearer ', '');

    if (!token || !activeSessions.has(token)) {
      return HttpResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Not logged in.' },
        { status: 401 },
      );
    }

    return HttpResponse.json({ status: 'authenticated' }, { status: 200 });
  }),

  // POST /api/auth/login
  http.post(`${BASE_URL}/login`, async () => {
    await delay(200);
    return HttpResponse.json(
      { error: 'SERVICE_UNAVAILABLE', message: 'Service is under maintenance.' },
      { status: 503 }
    );
  }),

  // POST /api/auth/logout
  http.post(`${BASE_URL}/logout`, ({ request }) => {
    const auth = request.headers.get('authorization') ?? '';
    activeSessions.delete(auth.replace('Bearer ', ''));
    return new HttpResponse(null, { status: 204 });
  }),
];

