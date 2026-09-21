import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import type { Booking } from '../../model/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import styles from './BookingCard.module.scss';

interface BookingCardProps {
  booking: Booking;
  onDetails?: (booking: Booking) => void;
  onMessage?: (booking: Booking) => void;
}

export function BookingCard({ booking, onDetails, onMessage }: BookingCardProps) {
  return (
    <Card className={styles.root}>
      <Flex>
        <Box className={styles.imageWrap}>
          <img src={booking.image} alt={booking.title} className={styles.image} />
        </Box>

        <Box className={styles.content}>
          <Flex justify="between" align="start" gap="2" mb="1">
            <Text size="2" weight="bold">
              {booking.title}
            </Text>
            <StatusBadge status={booking.status} />
          </Flex>

          {booking.status === 'waitlisted' && booking.waitPosition !== undefined && (
            <Text as="p" size="1" color="amber" weight="medium" className={styles.metaLine}>
              Queue position #{booking.waitPosition}
            </Text>
          )}

          {booking.status === 'confirmed' && booking.daysLeft !== undefined && (
            <Flex align="center" gap="1" className={styles.metaLine}>
              <Clock size={10} />
              <Text size="1" color="indigo" weight="medium">
                Starts in {booking.daysLeft} days
              </Text>
            </Flex>
          )}

          <Flex gap="4" wrap="wrap" className={styles.details}>
            <Flex align="center" gap="1">
              <User size={11} />
              <Text size="1" color="gray">
                {booking.instructor}
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <Calendar size={11} />
              <Text size="1" color="gray">
                {booking.date}
              </Text>
            </Flex>
            <Flex align="center" gap="1">
              <MapPin size={11} />
              <Text size="1" color="gray">
                {booking.location}
              </Text>
            </Flex>
          </Flex>

          <Flex justify="between" align="center" mt="3">
            <Text size="2" weight="bold">
              {booking.price}
            </Text>
            <Flex gap="2">
              <Button size="1" variant="outline" color="gray" onClick={() => onDetails?.(booking)}>
                Details
              </Button>
              {booking.status === 'confirmed' && (
                <Button size="1" variant="outline" color="indigo" onClick={() => onMessage?.(booking)}>
                  Message
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
}
