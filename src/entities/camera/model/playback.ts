// TODO: Дубли с типами
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export interface CameraPlaybackParams {
  from: string;
  speed: PlaybackSpeed;
}
