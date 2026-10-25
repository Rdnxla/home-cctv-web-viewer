import type {PaginatedResponse, SortOrder} from '@/shared/api/pagination';

export const EVENT_CATEGORIES = ['alarm', 'warning', 'detection'] as const;

export const EVENT_TYPES = [
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

export const EVENT_PERIODS = ['1h', '24h', '7d', '30d', 'all'] as const;

export const EVENT_SORT_FIELDS = ['occurredAt', 'category', 'type', 'source'] as const;

export const DEVICE_SOURCE = 'device';

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventPeriod = (typeof EVENT_PERIODS)[number];
export type EventSortField = (typeof EVENT_SORT_FIELDS)[number];

export interface NvrEvent {
  cameraId: string | null;
  cameraName: string | null;
  category: EventCategory;
  id: string;
  message: string;
  occurredAt: string;
  type: EventType;
}

export interface EventListParams {
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

export interface EventRangeParams {
  cameraId: string;
  from: string;
  to: string;
}

export interface EventListResponse extends PaginatedResponse<NvrEvent> {
  /** Число событий по категориям с учётом всех фильтров, кроме самой категории */
  categoryCounts: Record<EventCategory, number>;
}
