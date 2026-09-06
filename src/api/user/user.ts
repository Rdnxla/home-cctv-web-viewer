import {apiFetch} from '@/shared/api/http';

function getDashboard() {
  return apiFetch('/api/me/context', {
    method: 'GET',
  });
}

export {getDashboard};
