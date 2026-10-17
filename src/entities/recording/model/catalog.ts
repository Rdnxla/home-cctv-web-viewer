/** Режим записи файла: постоянно или только вокруг событий детекции */
export const RECORDING_TRIGGERS = ['continuous', 'event'] as const;

export type RecordingTrigger = (typeof RECORDING_TRIGGERS)[number];
