import type {PaginatedResponse, SortOrder} from '@/shared/api/pagination';

const EVENT_CATEGORIES = ['alarm', 'warning', 'detection'] as const;

const EVENT_TYPES = [
  'intrusion',
  'tampering',
  'video_loss',
  'power_failure',
  'disk_error',
  'disk_full',
  'poe_overload',
  'network_unstable',
  'login_failed',
  'motion',
  'person',
  'vehicle',
  'line_crossing',
] as const;

const EVENT_PERIODS = ['1h', '24h', '7d', '30d', 'all'] as const;

const EVENT_SORT_FIELDS = ['occurredAt', 'category', 'type', 'source'] as const;

const DEVICE_SOURCE = 'device';

type EventCategory = (typeof EVENT_CATEGORIES)[number];
type EventType = (typeof EVENT_TYPES)[number];
type EventPeriod = (typeof EVENT_PERIODS)[number];
type EventSortField = (typeof EVENT_SORT_FIELDS)[number];

interface NvrEvent {
  cameraId: string | null;
  cameraName: string | null;
  category: EventCategory;
  id: string;
  message: string;
  occurredAt: string;
  type: EventType;
}

interface EventListParams {
  categories: EventCategory[];
  order: SortOrder;
  page: number;
  pageSize: number;
  period: EventPeriod;
  query: string;
  sort: EventSortField;
  source: string | null;
  types: EventType[];
}

interface EventRangeParams {
  cameraId: string;
  from: string;
  to: string;
}

interface EventListResponse extends PaginatedResponse<NvrEvent> {
  /** Число событий по категориям с учётом всех фильтров, кроме самой категории */
  categoryCounts: Record<EventCategory, number>;
}

export type {
  EventCategory,
  EventListParams,
  EventListResponse,
  EventPeriod,
  EventRangeParams,
  EventSortField,
  EventType,
  NvrEvent,
};
export {DEVICE_SOURCE, EVENT_CATEGORIES, EVENT_PERIODS, EVENT_SORT_FIELDS, EVENT_TYPES};
