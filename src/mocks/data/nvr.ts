import type { Camera, CameraStatus, NvrInfo, PoePort } from './nvrtypes';

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

export const NVR_IP = '192.168.1.10';

/**
 * Порядок в массиве намеренно перемешан — сортировку делает handler,
 * чтобы проверить, что UI получает данные уже в нужном порядке.
 */
export const cameras: Camera[] = [
  {
    id: 'cam-4',
    name: 'Задний двор',
    portId: 4,
    status: 'no_connection',
    ip: null,
    mac: null,
    model: null,
    resolution: null,
    fps: null,
    codec: null,
    lastSeen: null,
    error: null,
  },
  {
    id: 'cam-1',
    name: 'Входная дверь',
    portId: 1,
    status: 'online',
    ip: '192.168.254.2',
    mac: 'A4:11:62:3F:00:01',
    model: 'IPC-HFW2431S',
    resolution: '2688x1520',
    fps: 25,
    codec: 'H.265',
    lastSeen: minutesAgo(0),
    error: null,
  },
  {
    id: 'cam-3',
    name: 'Парковка',
    portId: 3,
    status: 'error',
    ip: '192.168.254.4',
    mac: 'A4:11:62:3F:00:03',
    model: 'IPC-HFW2431S',
    resolution: '2688x1520',
    fps: 25,
    codec: 'H.265',
    lastSeen: minutesAgo(47),
    error: {
      code: 'CONNECTION_TIMEOUT',
      message: 'Камера не отвечает: превышено время ожидания RTSP (10 с)',
    },
  },
  {
    id: 'cam-2',
    name: 'Гараж',
    portId: 2,
    status: 'online',
    ip: '192.168.254.3',
    mac: 'A4:11:62:3F:00:02',
    model: 'IPC-HDW1431T',
    resolution: '2560x1440',
    fps: 20,
    codec: 'H.264',
    lastSeen: minutesAgo(0),
    error: null,
  },
];

/** online → error → no_connection */
export const STATUS_ORDER: Record<CameraStatus, number> = {
  online: 0,
  error: 1,
  no_connection: 2,
};

export function sortCameras(list: Camera[]): Camera[] {
  return [...list].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.portId - b.portId, // внутри группы — по номеру порта
  );
}

export const poePorts: PoePort[] = [
  { id: 1, number: 1, linkUp: true, poeEnabled: true, powerW: 6.8, maxPowerW: 30, cameraId: 'cam-1' },
  { id: 2, number: 2, linkUp: true, poeEnabled: true, powerW: 5.2, maxPowerW: 30, cameraId: 'cam-2' },
  // Питание подаётся, линк есть, но камера не отвечает по RTSP
  { id: 3, number: 3, linkUp: true, poeEnabled: true, powerW: 1.1, maxPowerW: 30, cameraId: 'cam-3' },
  // Ничего не подключено
  { id: 4, number: 4, linkUp: false, poeEnabled: true, powerW: 0, maxPowerW: 30, cameraId: null },
];

export function getNvrInfo(): NvrInfo {
  const poeUsedW = Number(poePorts.reduce((sum, p) => sum + p.powerW, 0).toFixed(1));
  return {
    id: 'nvr-1',
    name: 'NVR Главный',
    model: 'NVR2104-P-4KS2',
    firmware: 'V4.001.0000000.2',
    serialNumber: '8K02A1DPAZ12345',
    ip: NVR_IP,
    poePorts: poePorts.length,
    poeBudgetW: 60,
    poeUsedW,
    uptimeSec: 12 * 24 * 3600 + 5 * 3600,
    storage: { totalGb: 2000, usedGb: 1243, status: 'ok' },
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