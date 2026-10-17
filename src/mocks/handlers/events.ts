import {delay, HttpResponse, http} from 'msw';
import type {EventCategory, EventListResponse, EventSortField, NvrEvent} from '@/entities/event';
import {
  DEVICE_SOURCE,
  DEVICE_SOURCE_LABEL,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_META,
  EVENT_SORT_FIELDS,
  EVENT_TYPE_META,
  EVENT_TYPES,
} from '@/entities/event';
import {ApiErrorCode} from '@/shared/api/authErrorCodes';
import type {SortOrder} from '@/shared/api/pagination';
import {isOneOf} from '@/shared/lib/isOneOf';
import {events} from '../data/events';

const API = '/api/events';
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const RESPONSE_DELAY_MS = 350;
const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];
/** Поисковый запрос, на который мок отвечает 500, — для проверки состояния ошибки в UI */
const SERVER_ERROR_QUERY = 'error500';

const collator = new Intl.Collator('ru');

interface EventQuery {
  categories: EventCategory[];
  from: number | null;
  order: SortOrder;
  page: number;
  pageSize: number;
  query: string;
  sort: EventSortField;
  source: string | null;
  to: number | null;
  types: NvrEvent['type'][];
}

const COMPARATORS: Record<EventSortField, (a: NvrEvent, b: NvrEvent) => number> = {
  category: (a, b) => EVENT_CATEGORY_META[a.category].rank - EVENT_CATEGORY_META[b.category].rank,
  occurredAt: (a, b) => a.occurredAt.localeCompare(b.occurredAt),
  source: (a, b) => collator.compare(a.cameraName ?? DEVICE_SOURCE_LABEL, b.cameraName ?? DEVICE_SOURCE_LABEL),
  type: (a, b) => collator.compare(EVENT_TYPE_META[a.type].label, EVENT_TYPE_META[b.type].label),
};

function validationError(message: string) {
  return HttpResponse.json({error: ApiErrorCode.validationError, message}, {status: 400});
}

/** Разбор и проверка query-параметров; строка — текст ошибки валидации */
function parseQuery(search: URLSearchParams): EventQuery | string {
  const page = Number(search.get('page') ?? '1');
  const pageSize = Number(search.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));
  const sort = search.get('sort') ?? 'occurredAt';
  const order = search.get('order') ?? 'desc';
  const rawCategories = search.getAll('category');
  const rawTypes = search.getAll('type');
  const categories = rawCategories.filter(value => isOneOf(EVENT_CATEGORIES, value));
  const types = rawTypes.filter(value => isOneOf(EVENT_TYPES, value));
  const fromParam = search.get('from');
  const from = fromParam === null ? null : Date.parse(fromParam);
  const toParam = search.get('to');
  const to = toParam === null ? null : Date.parse(toParam);

  if (!Number.isInteger(page) || page < 1) return 'page: ожидается целое число не меньше 1';
  if (!PAGE_SIZES.includes(pageSize)) return `pageSize: допустимые значения ${PAGE_SIZES.join(', ')}`;
  if (!isOneOf(EVENT_SORT_FIELDS, sort)) return `sort: допустимые значения ${EVENT_SORT_FIELDS.join(', ')}`;
  if (!isOneOf(SORT_ORDERS, order)) return 'order: допустимые значения asc, desc';
  if (categories.length !== rawCategories.length) return `category: допустимые значения ${EVENT_CATEGORIES.join(', ')}`;
  if (types.length !== rawTypes.length) return 'type: неизвестный тип события';
  if (from !== null && Number.isNaN(from)) return 'from: ожидается дата в формате ISO 8601';
  if (to !== null && Number.isNaN(to)) return 'to: ожидается дата в формате ISO 8601';

  return {
    categories,
    from,
    order,
    page,
    pageSize,
    query: (search.get('q') ?? '').trim().toLocaleLowerCase('ru'),
    sort,
    source: search.get('source'),
    to,
    types,
  };
}

function matchesSource(event: NvrEvent, source: string | null) {
  if (source === null) return true;
  if (source === DEVICE_SOURCE) return event.cameraId === null;
  return event.cameraId === source;
}

function matchesQuery(event: NvrEvent, query: string) {
  if (query === '') return true;
  const haystack = [event.message, event.cameraName ?? DEVICE_SOURCE_LABEL, EVENT_TYPE_META[event.type].label];
  return haystack.some(text => text.toLocaleLowerCase('ru').includes(query));
}

function sortEvents(list: NvrEvent[], sort: EventSortField, order: SortOrder) {
  const direction = order === 'asc' ? 1 : -1;
  const compare = COMPARATORS[sort];
  // При равенстве — сначала новые, затем по id: порядок стабилен между страницами
  return list.sort(
    (a, b) => direction * compare(a, b) || b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id)
  );
}

export const eventHandlers = [
  /**
   * Журнал событий с серверной фильтрацией, сортировкой и пагинацией.
   * Параметры: page, pageSize (10|25|50|100), sort (occurredAt|category|type|source), order (asc|desc),
   * category и type (можно повторять), source (id камеры или `device`), from и to (ISO, `[from, to)`), q (поиск).
   */
  http.get(API, async ({request}) => {
    await delay(RESPONSE_DELAY_MS);

    const parsed = parseQuery(new URL(request.url).searchParams);
    if (typeof parsed === 'string') return validationError(parsed);

    if (parsed.query === SERVER_ERROR_QUERY) {
      return HttpResponse.json(
        {error: ApiErrorCode.internalError, message: 'Журнал событий временно недоступен'},
        {status: 500}
      );
    }

    const {categories, from, order, page, pageSize, query, sort, source, to, types} = parsed;

    // Все фильтры, кроме категории: по этой выборке считаются счётчики вкладок категорий
    const base = events.filter(
      event =>
        (from === null || Date.parse(event.occurredAt) >= from) &&
        (to === null || Date.parse(event.occurredAt) < to) &&
        (types.length === 0 || types.includes(event.type)) &&
        matchesSource(event, source) &&
        matchesQuery(event, query)
    );

    const categoryCounts: Record<EventCategory, number> = {alarm: 0, detection: 0, warning: 0};
    for (const event of base) categoryCounts[event.category] += 1;

    const filtered = categories.length === 0 ? base : base.filter(event => categories.includes(event.category));
    const sorted = sortEvents(filtered, sort, order);
    const start = (page - 1) * pageSize;

    return HttpResponse.json<EventListResponse>({
      categoryCounts,
      items: sorted.slice(start, start + pageSize),
      page,
      pageSize,
      total: sorted.length,
    });
  }),
];
