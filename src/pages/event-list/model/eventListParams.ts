import {EVENT_TYPE_META} from '@/entities/event';
import type {SortOrder} from '@/shared/api/pagination';
import {isOneOf} from '@/shared/lib/isOneOf';
import type {EventListParams, EventSortField} from '@/api/events/types';
import {EVENT_CATEGORIES, EVENT_PERIODS, EVENT_SORT_FIELDS, EVENT_TYPES} from '@/api/events/types';

const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];

/** Направление при первом клике по колонке: время и категория — сначала новые и важные */
const DEFAULT_ORDER: Record<EventSortField, SortOrder> = {
  category: 'desc',
  occurredAt: 'desc',
  source: 'asc',
  type: 'asc',
};

const URL_KEYS = {
  category: 'category',
  order: 'order',
  page: 'page',
  pageSize: 'size',
  period: 'period',
  query: 'q',
  sort: 'sort',
  source: 'source',
  type: 'type',
} as const;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export const DEFAULT_EVENT_LIST_PARAMS: EventListParams = {
  categories: [],
  order: 'desc',
  page: 1,
  pageSize: 25,
  period: '7d',
  query: '',
  sort: 'occurredAt',
  source: null,
  types: [],
};

export type EventListFilters = Pick<EventListParams, 'categories' | 'period' | 'query' | 'source' | 'types'>;

export function parseEventListParams(search: URLSearchParams): EventListParams {
  const defaults = DEFAULT_EVENT_LIST_PARAMS;
  const sortParam = search.get(URL_KEYS.sort);
  const orderParam = search.get(URL_KEYS.order);
  const periodParam = search.get(URL_KEYS.period);
  const pageSize = Number(search.get(URL_KEYS.pageSize));
  const sort = isOneOf(EVENT_SORT_FIELDS, sortParam) ? sortParam : defaults.sort;

  // Порядок из констант, а не из URL: одинаковые выборки дают одинаковый ключ кеша
  const categoryParams = search.getAll(URL_KEYS.category);
  const categories = EVENT_CATEGORIES.filter(category => categoryParams.includes(category));
  const typeParams = search.getAll(URL_KEYS.type);
  // Типы вне выбранных категорий отбрасываются: иначе выборка заведомо пуста
  const types = EVENT_TYPES.filter(
    type =>
      typeParams.includes(type) && (categories.length === 0 || categories.includes(EVENT_TYPE_META[type].category))
  );

  return {
    categories,
    order: isOneOf(SORT_ORDERS, orderParam) ? orderParam : DEFAULT_ORDER[sort],
    page: parsePage(search.get(URL_KEYS.page)),
    pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : defaults.pageSize,
    period: isOneOf(EVENT_PERIODS, periodParam) ? periodParam : defaults.period,
    query: search.get(URL_KEYS.query) ?? '',
    sort,
    source: search.get(URL_KEYS.source) || null,
    types,
  };
}

export function serializeEventListParams(params: EventListParams) {
  const defaults = DEFAULT_EVENT_LIST_PARAMS;
  const search = new URLSearchParams();

  for (const category of params.categories) search.append(URL_KEYS.category, category);
  for (const type of params.types) search.append(URL_KEYS.type, type);
  if (params.source !== null) search.set(URL_KEYS.source, params.source);
  if (params.period !== defaults.period) search.set(URL_KEYS.period, params.period);
  if (params.query !== '') search.set(URL_KEYS.query, params.query);
  if (params.sort !== defaults.sort) search.set(URL_KEYS.sort, params.sort);
  if (params.order !== DEFAULT_ORDER[params.sort]) search.set(URL_KEYS.order, params.order);
  if (params.pageSize !== defaults.pageSize) search.set(URL_KEYS.pageSize, String(params.pageSize));
  if (params.page !== 1) search.set(URL_KEYS.page, String(params.page));

  return search;
}

export function getNextSort(
  current: Pick<EventListParams, 'order' | 'sort'>,
  field: EventSortField
): Pick<EventListParams, 'order' | 'sort'> {
  if (current.sort === field) {
    return {order: current.order === 'asc' ? 'desc' : 'asc', sort: field};
  }
  return {order: DEFAULT_ORDER[field], sort: field};
}

export function hasActiveFilters(params: EventListParams) {
  const defaults = DEFAULT_EVENT_LIST_PARAMS;
  return (
    params.categories.length > 0 ||
    params.types.length > 0 ||
    params.source !== null ||
    params.period !== defaults.period ||
    params.query.trim() !== ''
  );
}
