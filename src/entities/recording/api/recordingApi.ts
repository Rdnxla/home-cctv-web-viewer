import {apiFetch} from '@/shared/api/http';
import type {RecordingListParams, RecordingListResponse} from '../model/types';

/** Файлы архива камеры, пересекающие период, и границы всего архива */
export function getRecordings(params: RecordingListParams) {
  const search = new URLSearchParams({from: params.from, to: params.to});
  return apiFetch<RecordingListResponse>(
    `/api/cameras/${encodeURIComponent(params.cameraId)}/recordings?${search.toString()}`
  );
}
