import {useCallback, useMemo} from 'react';
import {useSearchParams} from 'react-router';
import {startOfDay} from '../lib/time';
import type {ArchiveParams} from './archiveParams';
import {parseArchiveParams, serializeArchiveParams} from './archiveParams';

/**
 * Смена камеры, дня и переход к закладке добавляют запись в историю, перемотка внутри просмотра —
 * заменяет текущую, чтобы «Назад» не листал каждый щелчок по шкале.
 */
export function useArchiveParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseArchiveParams(searchParams, Date.now()), [searchParams]);

  const update = useCallback(
    (patch: Partial<ArchiveParams>, replace: boolean) => {
      setSearchParams(
        previous => {
          const now = Date.now();
          return serializeArchiveParams({...parseArchiveParams(previous, now), ...patch}, now);
        },
        {replace}
      );
    },
    [setSearchParams]
  );

  const selectCamera = useCallback(
    (cameraId: string) => {
      update({cameraId}, false);
    },
    [update]
  );

  const selectDay = useCallback(
    (dayStart: number) => {
      update({dayStart, moment: null}, false);
    },
    [update]
  );

  const seek = useCallback(
    (moment: number) => {
      update({dayStart: startOfDay(moment), moment}, true);
    },
    [update]
  );

  const openMoment = useCallback(
    (moment: number) => {
      update({dayStart: startOfDay(moment), moment}, false);
    },
    [update]
  );

  return {openMoment, params, seek, selectCamera, selectDay};
}
