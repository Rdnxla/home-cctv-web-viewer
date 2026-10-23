import type {ChangeEvent} from 'react';
import {useCallback, useMemo} from 'react';
import {useRecordingsQuery} from '@/entities/recording';
import {useNow} from '@/shared/lib/useNow';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import {getDayRange, parseDayKey, shiftDay, startOfDay, toDayKey} from '../lib/time';
import {useArchiveParams} from './useArchiveParams';

/** «Сегодня» сменится в полночь и без перезагрузки страницы */
const TODAY_REFRESH_MS = 60_000;

const dayTitleFormat = new Intl.DateTimeFormat('ru', {day: 'numeric', month: 'long', weekday: 'long', year: 'numeric'});

/**
 * Данные страницы архива: камера, день и момент из URL, список камер, записи выбранной камеры за день
 * и переходы по дням для шапки. Пока камера в URL не выбрана, показывается первая камера из списка.
 */
export function useArchivePage() {
  const {openMoment, params, seek, selectCamera, selectDay} = useArchiveParams();
  const {dayStart, moment} = params;
  const camerasQuery = useCamerasQuery();
  const {data: cameras, refetch: refetchCameras} = camerasQuery;
  const requestedId = params.cameraId ?? cameras?.[0]?.id ?? null;
  const camera = cameras?.find(item => item.id === requestedId);
  const cameraId = camera?.id ?? null;
  const day = useMemo(() => getDayRange(dayStart), [dayStart]);
  const recordingsParams = useMemo(
    () =>
      cameraId === null
        ? null
        : {cameraId, from: new Date(day.start).toISOString(), to: new Date(day.end).toISOString()},
    [cameraId, day]
  );
  const recordingsQuery = useRecordingsQuery(recordingsParams);
  const bounds = recordingsQuery.data?.bounds;
  const today = startOfDay(useNow(TODAY_REFRESH_MS));
  const firstDay = bounds ? startOfDay(Date.parse(bounds.from)) : null;

  const retryCameras = useCallback(() => {
    refetchCameras().catch(() => ({}));
  }, [refetchCameras]);

  const goToPreviousDay = useCallback(() => {
    selectDay(shiftDay(dayStart, -1));
  }, [dayStart, selectDay]);

  const goToNextDay = useCallback(() => {
    selectDay(shiftDay(dayStart, 1));
  }, [dayStart, selectDay]);

  const goToToday = useCallback(() => {
    selectDay(today);
  }, [selectDay, today]);

  const changeDay = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = parseDayKey(event.target.value);
      if (next !== null) selectDay(Math.min(next, today));
    },
    [selectDay, today]
  );

  return {
    camera,
    camerasQuery,
    canGoBack: firstDay === null || dayStart > firstDay,
    canGoForward: dayStart < today,
    changeDay,
    day,
    dayKey: toDayKey(dayStart),
    dayTitle: dayTitleFormat.format(dayStart),
    goToNextDay,
    goToPreviousDay,
    goToToday,
    isToday: dayStart === today,
    maxDayKey: toDayKey(today),
    minDayKey: firstDay === null ? undefined : toDayKey(firstDay),
    moment,
    openMoment,
    recordingsQuery,
    retryCameras,
    seek,
    selectCamera,
  };
}
