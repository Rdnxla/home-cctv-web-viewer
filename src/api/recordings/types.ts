export const RECORDING_TRIGGERS = ['continuous', 'event'] as const;

export type RecordingTrigger = (typeof RECORDING_TRIGGERS)[number];

export interface Recording {
  cameraId: string;
  endedAt: string | null;
  id: string;
  sizeBytes: number;
  startedAt: string;
  trigger: RecordingTrigger;
}

export interface ArchiveBounds {
  from: string;
  to: string;
}

export interface RecordingListParams {
  cameraId: string;
  from: string;
  to: string;
}

export interface RecordingListResponse {
  bounds: ArchiveBounds | null;
  items: Recording[];
}
