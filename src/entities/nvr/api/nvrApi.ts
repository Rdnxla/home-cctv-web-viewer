import {apiFetch} from '@/shared/api/http';
import type {NvrInfo} from '../model/types';

const NVR_URL = '/api/nvr';

export function getNvrInfo() {
  return apiFetch<NvrInfo>(NVR_URL);
}
