import {useCallback, useMemo} from 'react';
import {useSearchParams} from 'react-router';
import type {EventListParams, EventSortField} from '@/api/events/types';
import type {EventListFilters} from './eventListParams';
import {
  DEFAULT_EVENT_LIST_PARAMS,
  getNextSort,
  parseEventListParams,
  serializeEventListParams,
} from './eventListParams';

export function useEventListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseEventListParams(searchParams), [searchParams]);

  const update = useCallback(
    (getPatch: (current: EventListParams) => Partial<EventListParams>, replace = false) => {
      setSearchParams(
        previous => {
          const current = parseEventListParams(previous);
          return serializeEventListParams({...current, ...getPatch(current)});
        },
        {replace}
      );
    },
    [setSearchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<EventListFilters>) => {
      update(() => ({...patch, page: 1}), 'query' in patch);
    },
    [update]
  );

  const setPage = useCallback(
    (page: number) => {
      update(() => ({page}));
    },
    [update]
  );

  const replacePage = useCallback(
    (page: number) => {
      update(() => ({page}), true);
    },
    [update]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      update(() => ({page: 1, pageSize}));
    },
    [update]
  );

  const toggleSort = useCallback(
    (field: EventSortField) => {
      update(current => ({...getNextSort(current, field), page: 1}));
    },
    [update]
  );

  const resetFilters = useCallback(() => {
    const {categories, period, query, source, types} = DEFAULT_EVENT_LIST_PARAMS;
    update(() => ({categories, page: 1, period, query, source, types}));
  }, [update]);

  return {params, replacePage, resetFilters, setFilters, setPage, setPageSize, toggleSort};
}
