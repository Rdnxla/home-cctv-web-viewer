import { Badge } from '@radix-ui/themes';
import type { BookingStatus } from '../../model/types';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: 'green' | 'amber' }> = {
  confirmed: { label: 'Confirmed', color: 'green' },
  waitlisted: { label: 'Waitlisted', color: 'amber' },
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge color={config.color} variant="soft" radius="full">
      {config.label}
    </Badge>
  );
}
