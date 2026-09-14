export const ApiErrorCode = {
  validationError: 'VALIDATION_ERROR',
  invalidCredentials: 'INVALID_CREDENTIALS',
  accountLocked: 'ACCOUNT_LOCKED',
  emailNotVerified: 'EMAIL_NOT_VERIFIED',
  passwordResetRequired: 'PASSWORD_RESET_REQUIRED',
  rateLimited: 'RATE_LIMITED',
  invalidSession: 'INVALID_SESSION',
  invalidCode: 'INVALID_CODE',
  invalidRefreshToken: 'INVALID_REFRESH_TOKEN',
  unauthenticated: 'UNAUTHENTICATED',
  invalidBody: 'INVALID_BODY',
  internalError: 'INTERNAL_ERROR',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
  unknownError: 'UNKNOWN_ERROR'
} as const

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]
