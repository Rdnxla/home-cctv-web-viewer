export type CameraStatus = 'online' | 'error' | 'no_connection';

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface Camera {
  id: string;
  name: string;
  portId: number;
  status: CameraStatus;
  /** null — камера не обнаружена, IP не назначен */
  ip: string | null;
  mac: string | null;
  model: string | null;
  resolution: string | null;
  fps: number | null;
  codec: 'H.264' | 'H.265' | null;
  lastSeen: string | null;
  /** Заполнено только для status === 'error' */
  error: ApiErrorBody | null;
}

export interface PoePort {
  id: number;
  /** Физический номер порта на NVR */
  number: number;
  linkUp: boolean;
  poeEnabled: boolean;
  powerW: number;
  maxPowerW: number;
  cameraId: string | null;
}

export interface NvrInfo {
  id: string;
  name: string;
  model: string;
  firmware: string;
  serialNumber: string;
  ip: string;
  poePorts: number;
  poeBudgetW: number;
  poeUsedW: number;
  uptimeSec: number;
  storage: {
    totalGb: number;
    usedGb: number;
    status: 'ok' | 'degraded' | 'missing';
  };
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/** Параметры WebRTC-подключения (WHEP) к камере */
export interface StreamInfo {
  cameraId: string;
  protocol: 'webrtc';
  /** Эндпоинт WHEP: POST с SDP offer -> 201 с SDP answer */
  whepUrl: string;
  iceServers: IceServer[];
  codec: 'H.264' | 'H.265' | null;
  resolution: string | null;
  fps: number | null;
  expiresAt: string;
}
