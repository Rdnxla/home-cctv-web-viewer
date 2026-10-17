import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import type {EventListParams} from '../model/types';
import {getEvents} from './eventApi';

const EVENTS_KEY = 'events';

/** Ключи начинаются с имени сущности: `invalidateQueries({queryKey: eventKeys.all})` сбрасывает весь журнал */
export const eventKeys = {
  all: [EVENTS_KEY] as const,
  list: (params: EventListParams) => [EVENTS_KEY, 'list', params] as const,
};

export function useEventsQuery(params: EventListParams) {
  return useQuery({
    // При смене страницы, сортировки или фильтра таблица остаётся на месте, пока грузится новая выборка
    placeholderData: keepPreviousData,
    queryFn: () => getEvents(params),
    queryKey: eventKeys.list(params),
    retry: retryUnlessClientError,
  });
}
