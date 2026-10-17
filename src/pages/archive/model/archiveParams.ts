import {formatLocalDateTime, parseDayKey, parseLocalDateTime, startOfDay, toDayKey} from '../lib/time';

/**
 * Состояние архива живёт в URL (`/archive?camera=cam-1&t=2026-10-17T14:05:09`): ссылка открывает тот же момент,
 * «Назад» возвращает к прошлой камере или дню. День берётся из момента `t`; без момента — из `day`; без него — сегодня.
 * Момент и день — местное время браузера, как и всё время в интерфейсе.
 */

const URL_KEYS = {cameraId: 'camera', day: 'day', moment: 't'} as const;

export interface ArchiveParams {
  /** `null` — камера не выбрана, показывается первая из списка */
  cameraId: string | null;
  /** Полночь выбранного дня */
  dayStart: number;
  /** Последний выбранный момент; `null` — не выбран */
  moment: number | null;
}

export function parseArchiveParams(search: URLSearchParams, now: number): ArchiveParams {
  const today = startOfDay(now);
  const parsedMoment = parseLocalDateTime(search.get(URL_KEYS.moment));
  // Будущего в архиве нет
  const moment = parsedMoment !== null && parsedMoment <= now ? parsedMoment : null;
  const requestedDay = moment === null ? parseDayKey(search.get(URL_KEYS.day)) : startOfDay(moment);

  return {
    cameraId: search.get(URL_KEYS.cameraId) || null,
    dayStart: requestedDay === null || requestedDay > today ? today : requestedDay,
    moment,
  };
}

export function serializeArchiveParams(params: ArchiveParams, now: number) {
  const search = new URLSearchParams();

  if (params.cameraId !== null) search.set(URL_KEYS.cameraId, params.cameraId);
  if (params.moment !== null) {
    search.set(URL_KEYS.moment, formatLocalDateTime(params.moment));
  } else if (params.dayStart !== startOfDay(now)) {
    search.set(URL_KEYS.day, toDayKey(params.dayStart));
  }

  return search;
}
