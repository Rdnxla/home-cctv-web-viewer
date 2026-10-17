/** Категории журнала, от самой важной к наименее важной */
export const EVENT_CATEGORIES = ['alarm', 'warning', 'detection'] as const;

/** Типы событий регистратора; порядок — по категориям, как в фильтре */
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

/** Предустановленные периоды журнала (на сервер уходит граница `from`) */
export const EVENT_PERIODS = ['1h', '24h', '7d', '30d', 'all'] as const;

export const EVENT_SORT_FIELDS = ['occurredAt', 'category', 'type', 'source'] as const;

/** Значение фильтра `source` для событий самого регистратора, а не камер */
export const DEVICE_SOURCE = 'device';

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventPeriod = (typeof EVENT_PERIODS)[number];
export type EventSortField = (typeof EVENT_SORT_FIELDS)[number];
