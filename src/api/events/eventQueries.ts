import {keepPreviousData, skipToken, useQuery} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import {getEvents, getEventsInRange} from './eventApi';
import type {EventListParams, EventRangeParams} from './types';

const EVENTS_KEY = 'events';

const eventKeys = {
  all: [EVENTS_KEY] as const,
  list: (params: EventListParams) => [EVENTS_KEY, 'list', params] as const,
  range: (params: EventRangeParams | null) => [EVENTS_KEY, 'range', params] as const,
};

function useEventsQuery(params: EventListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getEvents(params),
    queryKey: eventKeys.list(params),
    retry: retryUnlessClientError,
  });
}

function useEventsInRangeQuery(params: EventRangeParams | null) {
  return useQuery({
    queryFn: params === null ? skipToken : () => getEventsInRange(params),
    queryKey: eventKeys.range(params),
    retry: retryUnlessClientError,
  });
}

export {eventKeys, useEventsInRangeQuery, useEventsQuery};
