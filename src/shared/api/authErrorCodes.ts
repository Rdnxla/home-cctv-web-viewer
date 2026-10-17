export const ApiErrorCode = {
  accountLocked: 'ACCOUNT_LOCKED',
  bookmarkNotFound: 'BOOKMARK_NOT_FOUND',
  cameraNotFound: 'CAMERA_NOT_FOUND',
  emailNotVerified: 'EMAIL_NOT_VERIFIED',
  internalError: 'INTERNAL_ERROR',
  invalidBody: 'INVALID_BODY',
  invalidCode: 'INVALID_CODE',
  invalidCredentials: 'INVALID_CREDENTIALS',
  invalidRefreshToken: 'INVALID_REFRESH_TOKEN',
  invalidSession: 'INVALID_SESSION',
  passwordResetRequired: 'PASSWORD_RESET_REQUIRED',
  rateLimited: 'RATE_LIMITED',
  recordingNotFound: 'RECORDING_NOT_FOUND',
  serviceUnavailable: 'SERVICE_UNAVAILABLE',
  unauthenticated: 'UNAUTHENTICATED',
  unknownError: 'UNKNOWN_ERROR',
  validationError: 'VALIDATION_ERROR',
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
