export type BookingStatus = 'confirmed' | 'waitlisted';

export interface Booking {
  id: number;
  title: string;
  instructor: string;
  date: string;
  location: string;
  status: BookingStatus;
  price: string;
  image: string;
  /** Only present for confirmed bookings that are coming up */
  daysLeft?: number;
  /** Only present for waitlisted bookings */
  waitPosition?: number;
}
