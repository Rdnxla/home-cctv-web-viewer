const RECORDING_TRIGGERS = ['continuous', 'event'] as const;

type RecordingTrigger = (typeof RECORDING_TRIGGERS)[number];

interface Recording {
  cameraId: string;
  endedAt: string | null;
  id: string;
  sizeBytes: number;
  startedAt: string;
  trigger: RecordingTrigger;
}

interface ArchiveBounds {
  from: string;
  to: string;
}

interface RecordingListParams {
  cameraId: string;
  from: string;
  to: string;
}

interface RecordingListResponse {
  bounds: ArchiveBounds | null;
  items: Recording[];
}

export type {ArchiveBounds, Recording, RecordingListParams, RecordingListResponse, RecordingTrigger};
export {RECORDING_TRIGGERS};
