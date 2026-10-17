import type {PaginatedResponse, SortOrder} from '@/shared/api/pagination';
import type {EventCategory, EventPeriod, EventSortField, EventType} from './catalog';

/** Запись журнала событий регистратора */
export interface NvrEvent {
  /** `null` — событие самого регистратора (диск, питание, вход в систему) */
  cameraId: string | null;
  cameraName: string | null;
  category: EventCategory;
  id: string;
  message: string;
  /** ISO 8601 */
  occurredAt: string;
  type: EventType;
}

/** Параметры журнала (`GET /api/events`) */
export interface EventListParams {
  /** Пусто — все категории */
  categories: EventCategory[];
  order: SortOrder;
  page: number;
  pageSize: number;
  period: EventPeriod;
  /** Поиск по описанию, типу и источнику */
  query: string;
  sort: EventSortField;
  /** id камеры, `DEVICE_SOURCE` или `null` — все источники */
  source: string | null;
  /** Пусто — все типы */
  types: EventType[];
}

/** События камеры за период `[from, to)` (ISO 8601) по возрастанию времени — для шкалы архива */
export interface EventRangeParams {
  cameraId: string;
  from: string;
  to: string;
}

export interface EventListResponse extends PaginatedResponse<NvrEvent> {
  /** Число событий по категориям с учётом всех фильтров, кроме самой категории */
  categoryCounts: Record<EventCategory, number>;
}
