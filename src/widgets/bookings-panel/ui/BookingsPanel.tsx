import { Box, Flex, Text } from '@radix-ui/themes';
import { BookingCard } from '@/entities/booking/ui/BookingCard/BookingCard';
import { NotificationsBell } from '@/features/notifications-bell/ui/NotificationsBell';
import { useBookingsPanel } from '../model/useBookingsPanel';
import styles from './BookingsPanel.module.scss';

export function BookingsPanel() {
  const { bookings } = useBookingsPanel();
  const data = bookings.data ?? [];
  const confirmedCount = data.filter((b) => b.status === 'confirmed').length;
  const waitlistedCount = data.filter((b) => b.status === 'waitlisted').length;

  return (
    <Box className={styles.root}>
      <Flex justify="between" align="center" className={styles.header}>
        <Box>
          <Text as="p" size="4" weight="bold">
            My Bookings
          </Text>
          <Text as="p" size="1" color="gray" mt="1">
            {data.length} programs · {confirmedCount} confirmed · {waitlistedCount} waitlisted
          </Text>
        </Box>
        <NotificationsBell />
      </Flex>

      <Box className={styles.list}>
        {bookings.isLoading && (
          <Text size="2" color="gray">
            Loading bookings...
          </Text>
        )}
        {bookings.error && (
          <Text size="2" color="red">
            Failed to load bookings
          </Text>
        )}
        {data.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </Box>
    </Box>
  );
}
