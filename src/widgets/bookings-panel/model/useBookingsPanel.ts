import { bookingApi } from '@/entities/booking/api/bookingApi';
import { useAsync } from '@/shared/lib/hooks/useAsync';

export function useBookingsPanel() {
  const bookings = useAsync(() => bookingApi.getMyBookings(), []);
  return { bookings };
}
