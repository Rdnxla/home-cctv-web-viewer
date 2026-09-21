import { httpClient } from '@/shared/api/httpClient';
import type { Booking } from '../model/types';

export const bookingApi = {
  getMyBookings: (): Promise<Booking[]> => httpClient.get<Booking[]>('/bookings/my'),
};
