type CameraStatus = 'online' | 'error' | 'no_connection';

interface CameraError {
  code: string;
  message: string;
}

interface Camera {
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

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface StreamInfo {
  cameraId: string;
  protocol: 'webrtc';
  whepUrl: string;
  iceServers: IceServer[];
  codec: 'H.264' | 'H.265' | null;
  resolution: string | null;
  fps: number | null;
  expiresAt: string;
}

const PLAYBACK_SPEEDS = [0.5, 1, 2, 4, 8, 16] as const;

type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

interface CameraPlaybackParams {
  from: string;
  speed: PlaybackSpeed;
}

export type {Camera, CameraError, CameraPlaybackParams, CameraStatus, IceServer, PlaybackSpeed, StreamInfo};
export {PLAYBACK_SPEEDS};
