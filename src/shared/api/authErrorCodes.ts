export const ApiErrorCode = {
  accountLocked: 'ACCOUNT_LOCKED',
  emailNotVerified: 'EMAIL_NOT_VERIFIED',
  internalError: 'INTERNAL_ERROR',
  invalidBody: 'INVALID_BODY',
  invalidCode: 'INVALID_CODE',
  invalidCredentials: 'INVALID_CREDENTIALS',
  invalidRefreshToken: 'INVALID_REFRESH_TOKEN',
  invalidSession: 'INVALID_SESSION',
  passwordResetRequired: 'PASSWORD_RESET_REQUIRED',
  rateLimited: 'RATE_LIMITED',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
  unauthenticated: 'UNAUTHENTICATED',
  unknownError: 'UNKNOWN_ERROR',
  validationError: 'VALIDATION_ERROR',
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
