import {apiFetch} from '@/shared/api/http';
import type {EventListParams, EventListResponse, EventPeriod, EventRangeParams} from './types';

const EVENTS_URL = '/api/events';
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
/** Максимальный размер страницы, который принимает API */
const RANGE_LIMIT = 100;

const PERIOD_DURATION_MS: Record<EventPeriod, number | null> = {
  '1h': HOUR_MS,
  '7d': 7 * DAY_MS,
  '24h': DAY_MS,
  '30d': 30 * DAY_MS,
  all: null,
};

/** Период превращается в границу `from` в момент запроса, поэтому повторный запрос с тем же периодом получает актуальное окно */
function getEvents(params: EventListParams, now = Date.now()) {
  const search = new URLSearchParams({
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
    sort: params.sort,
  });

  for (const category of params.categories) search.append('category', category);
  for (const type of params.types) search.append('type', type);
  if (params.source !== null) search.set('source', params.source);

  const durationMs = PERIOD_DURATION_MS[params.period];
  if (durationMs !== null) search.set('from', new Date(now - durationMs).toISOString());

  const query = params.query.trim();
  if (query !== '') search.set('q', query);

  return apiFetch<EventListResponse>(`${EVENTS_URL}?${search.toString()}`);
}

function getEventsInRange(params: EventRangeParams) {
  const search = new URLSearchParams({
    from: params.from,
    order: 'asc',
    page: '1',
    pageSize: String(RANGE_LIMIT),
    sort: 'occurredAt',
    source: params.cameraId,
    to: params.to,
  });

  return apiFetch<EventListResponse>(`${EVENTS_URL}?${search.toString()}`);
}

export {getEvents, getEventsInRange};
