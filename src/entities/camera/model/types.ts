export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export interface CameraPlaybackParams {
  from: string;
  speed: PlaybackSpeed;
}

// TODO: Типы тянутся как из data, так и из api. Не консистентно, нужен один источник истины, либо два, для апи и для модели
export type {Camera, CameraStatus, StreamInfo} from '@/mocks/data/nvrtypes';
export type {PlayerState} from '@/mocks/handlers/webrtc';
