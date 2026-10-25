import {apiFetch} from '@/shared/api/http';
import type {RecordingListParams, RecordingListResponse} from './types';

export function getRecordings(params: RecordingListParams) {
  const search = new URLSearchParams({from: params.from, to: params.to});
  return apiFetch<RecordingListResponse>(
    `/api/cameras/${encodeURIComponent(params.cameraId)}/recordings?${search.toString()}`
  );
}
