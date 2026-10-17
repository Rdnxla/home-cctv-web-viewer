import {skipToken, useQuery} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import type {RecordingListParams} from '../model/types';
import {getRecordings} from './recordingApi';

const RECORDINGS_KEY = 'recordings';
/** Пока период не закончился, архив растёт: файл, который пишется сейчас, удлиняется, появляются новые */
const GROWING_ARCHIVE_REFRESH_MS = 60_000;

/** Ключи начинаются с имени сущности: `invalidateQueries({queryKey: recordingKeys.all})` сбрасывает весь архив */
export const recordingKeys = {
  all: [RECORDINGS_KEY] as const,
  list: (params: RecordingListParams | null) => [RECORDINGS_KEY, 'list', params] as const,
};

/** Файлы архива за период; `null` — запрос пока не нужен (камера не выбрана) */
export function useRecordingsQuery(params: RecordingListParams | null) {
  return useQuery({
    queryFn: params === null ? skipToken : () => getRecordings(params),
    queryKey: recordingKeys.list(params),
    refetchInterval: () => (params !== null && Date.parse(params.to) > Date.now() ? GROWING_ARCHIVE_REFRESH_MS : false),
    retry: retryUnlessClientError,
  });
}
