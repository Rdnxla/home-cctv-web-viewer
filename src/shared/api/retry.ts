import {isApiError} from './http';

const MAX_RETRIES = 2;
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

/**
 * Политика `retry` для TanStack Query: 4xx (не найдено, неверные параметры) повторять бессмысленно,
 * 5xx и сетевые ошибки — до двух раз.
 */
export function retryUnlessClientError(failureCount: number, error: Error) {
  if (isApiError(error) && error.status >= HTTP_CLIENT_ERROR_MIN && error.status < HTTP_SERVER_ERROR_MIN) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}
