export type CameraStatus = 'online' | 'error' | 'no_connection';

export interface CameraError {
  code: string;
  message: string;
}

export interface Camera {
  id: string;
  name: string;
  portId: number;
  status: CameraStatus;
  ip: string | null;
  mac: string | null;
  model: string | null;
  resolution: string | null;
  fps: number | null;
  codec: 'H.264' | 'H.265' | null;
  lastSeen: string | null;
  error: CameraError | null;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface StreamInfo {
  cameraId: string;
  protocol: 'webrtc';
  whepUrl: string;
  iceServers: IceServer[];
  codec: 'H.264' | 'H.265' | null;
  resolution: string | null;
  fps: number | null;
  expiresAt: string;
}

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export interface CameraPlaybackParams {
  from: string;
  speed: PlaybackSpeed;
}
