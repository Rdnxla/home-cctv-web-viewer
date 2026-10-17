import {apiFetch} from '@/shared/api/http';
import {EVENT_PERIOD_META} from '../model/meta';
import type {EventListParams, EventListResponse} from '../model/types';

const EVENTS_URL = '/api/events';

/**
 * Страница журнала. Период превращается в границу `from` в момент запроса,
 * поэтому повторный запрос с тем же периодом получает актуальное окно.
 */
export function getEvents(params: EventListParams, now = Date.now()) {
  const search = new URLSearchParams({
    order: params.order,
    page: String(params.page),
    pageSize: String(params.pageSize),
    sort: params.sort,
  });

  for (const category of params.categories) search.append('category', category);
  for (const type of params.types) search.append('type', type);
  if (params.source !== null) search.set('source', params.source);

  const {durationMs} = EVENT_PERIOD_META[params.period];
  if (durationMs !== null) search.set('from', new Date(now - durationMs).toISOString());

  const query = params.query.trim();
  if (query !== '') search.set('q', query);

  return apiFetch<EventListResponse>(`${EVENTS_URL}?${search.toString()}`);
}
