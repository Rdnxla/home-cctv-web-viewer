import type {RecordingTrigger} from './catalog';

/** Файл архива камеры */
export interface Recording {
  cameraId: string;
  /** ISO 8601; `null` — файл ещё пишется */
  endedAt: string | null;
  id: string;
  sizeBytes: number;
  /** ISO 8601 */
  startedAt: string;
  trigger: RecordingTrigger;
}

/** Границы архива камеры: от начала самой старой записи до конца самой новой (ISO 8601) */
export interface ArchiveBounds {
  from: string;
  to: string;
}

/** Файлы архива камеры за период `[from, to)` (ISO 8601) */
export interface RecordingListParams {
  cameraId: string;
  from: string;
  to: string;
}

export interface RecordingListResponse {
  /** `null` — у камеры нет ни одной записи */
  bounds: ArchiveBounds | null;
  /** Файлы, пересекающие запрошенный период, по возрастанию времени начала */
  items: Recording[];
}
