import type {Camera, CameraStatus, NvrInfo, PoePort} from './nvrtypes';

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

export const NVR_IP = '192.168.1.10';

/**
 * Порядок в массиве намеренно перемешан — сортировку делает handler,
 * чтобы проверить, что UI получает данные уже в нужном порядке.
 */
export const cameras: Camera[] = [
  {
    codec: null,
    error: null,
    fps: null,
    id: 'cam-4',
    ip: null,
    lastSeen: null,
    mac: null,
    model: null,
    name: 'Задний двор',
    portId: 4,
    resolution: null,
    status: 'no_connection',
  },
  {
    codec: 'H.265',
    error: null,
    fps: 25,
    id: 'cam-1',
    ip: '192.168.254.2',
    lastSeen: minutesAgo(0),
    mac: 'A4:11:62:3F:00:01',
    model: 'IPC-HFW2431S',
    name: 'Входная дверь',
    portId: 1,
    resolution: '2688x1520',
    status: 'online',
  },
  {
    codec: 'H.265',
    error: {
      code: 'CONNECTION_TIMEOUT',
      message: 'Камера не отвечает: превышено время ожидания RTSP (10 с)',
    },
    fps: 25,
    id: 'cam-3',
    ip: '192.168.254.4',
    lastSeen: minutesAgo(47),
    mac: 'A4:11:62:3F:00:03',
    model: 'IPC-HFW2431S',
    name: 'Парковка',
    portId: 3,
    resolution: '2688x1520',
    status: 'error',
  },
  {
    codec: 'H.264',
    error: null,
    fps: 20,
    id: 'cam-2',
    ip: '192.168.254.3',
    lastSeen: minutesAgo(0),
    mac: 'A4:11:62:3F:00:02',
    model: 'IPC-HDW1431T',
    name: 'Гараж',
    portId: 2,
    resolution: '2560x1440',
    status: 'online',
  },
];

/** online → error → no_connection */
export const STATUS_ORDER: Record<CameraStatus, number> = {
  error: 1,
  no_connection: 2,
  online: 0,
};

export function sortCameras(list: Camera[]): Camera[] {
  return [...list].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.portId - b.portId // внутри группы — по номеру порта
  );
}

export const poePorts: PoePort[] = [
  {cameraId: 'cam-1', id: 1, linkUp: true, maxPowerW: 30, number: 1, poeEnabled: true, powerW: 6.8},
  {cameraId: 'cam-2', id: 2, linkUp: true, maxPowerW: 30, number: 2, poeEnabled: true, powerW: 5.2},
  // Питание подаётся, линк есть, но камера не отвечает по RTSP
  {cameraId: 'cam-3', id: 3, linkUp: true, maxPowerW: 30, number: 3, poeEnabled: true, powerW: 1.1},
  // Ничего не подключено
  {cameraId: null, id: 4, linkUp: false, maxPowerW: 30, number: 4, poeEnabled: true, powerW: 0},
];

export function getNvrInfo(): NvrInfo {
  const poeUsedW = Number(poePorts.reduce((sum, p) => sum + p.powerW, 0).toFixed(1));
  return {
    firmware: 'V4.001.0000000.2',
    id: 'nvr-1',
    ip: NVR_IP,
    model: 'NVR2104-P-4KS2',
    name: 'NVR Главный',
    poeBudgetW: 60,
    poePorts: poePorts.length,
    poeUsedW,
    serialNumber: '8K02A1DPAZ12345',
    storage: {status: 'ok', totalGb: 2000, usedGb: 1243},
    uptimeSec: 12 * 24 * 3600 + 5 * 3600,
  };
}

/** Внутренний RTSP-адрес — используется только шлюзом, браузеру он не отдаётся */
export function rtspSource(camera: Camera): string {
  return `rtsp://${NVR_IP}:554/cam/realmonitor?channel=${camera.portId}&subtype=0`;
}

export function whepUrl(camera: Camera): string {
  return `/api/webrtc/${camera.id}/whep`;
}

/** Статичный SDP answer для моков (реальное медиа через MSW не передать) */
export const MOCK_SDP_ANSWER = [
  'v=0',
  'o=- 1 1 IN IP4 127.0.0.1',
  's=-',
  't=0 0',
  'a=group:BUNDLE 0',
  'a=ice-lite',
  'm=video 9 UDP/TLS/RTP/SAVPF 96',
  'c=IN IP4 0.0.0.0',
  'a=mid:0',
  'a=sendonly',
  'a=rtcp-mux',
  'a=rtpmap:96 H264/90000',
  'a=ice-ufrag:mock',
  'a=ice-pwd:mockmockmockmockmockmock',
  'a=setup:passive',
  '',
].join('\r\n');
