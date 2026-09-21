import { httpClient } from '@/shared/api/httpClient';
import type { Instructor } from '../model/types';

export const instructorApi = {
  getMyInstructors: (): Promise<Instructor[]> => httpClient.get<Instructor[]>('/instructors/my'),
};
