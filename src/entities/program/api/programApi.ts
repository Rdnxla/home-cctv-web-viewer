import { httpClient } from '@/shared/api/httpClient';
import type { Program } from '../model/types';

export const programApi = {
  getRecommended: (search?: string): Promise<Program[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return httpClient.get<Program[]>(`/programs/recommended${query}`);
  },
};
