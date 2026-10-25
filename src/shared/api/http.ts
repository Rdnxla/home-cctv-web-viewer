import type {ApiErrorCodeType} from './authErrorCodes';
import {ApiErrorCode} from './authErrorCodes';

interface ApiError extends Error {
  status: number;
  code: ApiErrorCodeType;
  data: Record<string, unknown>;
}

function createApiError(
  status: number,
  code: ApiErrorCodeType,
  message: string,
  data: Record<string, unknown> = {}
): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  error.code = code;
  error.data = data;
  return error;
}

const isApiError = (error: unknown): error is ApiError => error instanceof Error && error.name === 'ApiError';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw createApiError(
      res.status,
      body.error ?? ApiErrorCode.unknownError,
      body.message ?? 'Something went wrong',
      body
    );
  }

  return body as T;
}

export type {ApiError};
export {apiFetch, createApiError, isApiError};
