import {Badge} from '@radix-ui/themes';
import type {EventCategory} from '@/api/events/types';
import {EVENT_CATEGORY_META} from '../model/meta';

interface EventCategoryBadgeProps {
  category: EventCategory;
}

export function EventCategoryBadge(props: EventCategoryBadgeProps) {
  const {category} = props;
  const meta = EVENT_CATEGORY_META[category];

  return (
    <Badge
      color={meta.color}
      variant={category === 'alarm' ? 'solid' : 'soft'}
    >
      {meta.label}
    </Badge>
  );
}
