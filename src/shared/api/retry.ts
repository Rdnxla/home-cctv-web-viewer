import {isApiError} from './http';

const MAX_RETRIES = 2;
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

export function retryUnlessClientError(failureCount: number, error: Error) {
  if (isApiError(error) && error.status >= HTTP_CLIENT_ERROR_MIN && error.status < HTTP_SERVER_ERROR_MIN) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}
