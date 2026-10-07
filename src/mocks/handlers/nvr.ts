import { delay, http, HttpResponse } from 'msw';
import {
  cameras,
  getNvrInfo,
  MOCK_SDP_ANSWER,
  poePorts,
  sortCameras,
  whepUrl,
} from '../data/nvr';
import type { ApiErrorBody, Camera, StreamInfo } from '../data/nvrtypes';

const API = '/api';

const errorResponse = (status: number, body: ApiErrorBody) =>
  HttpResponse.json(body, { status });

/**
 * Общая проверка доступности камеры для /stream и /whep.
 * Возвращает Response с ошибкой или null, если камера online.
 */
async function guardCamera(camera: Camera | undefined) {
  if (!camera) {
    await delay(200);
    return errorResponse(404, { code: 'CAMERA_NOT_FOUND', message: 'Камера не найдена' });
  }
  if (camera.status === 'error') {
    await delay(3000); // эмуляция долгого таймаута
    return errorResponse(
      504,
      camera.error ?? { code: 'CONNECTION_ERROR', message: 'Ошибка подключения к камере' },
    );
  }
  if (camera.status === 'no_connection') {
    await delay(300);
    return errorResponse(404, {
      code: 'NO_CONNECTION',
      message: `К порту ${camera.portId} камера не подключена`,
    });
  }
  return null;
}

export const nvrHandlers = [
  http.get(`${API}/nvr`, async () => {
    await delay(300);
    return HttpResponse.json(getNvrInfo());
  }),

  http.get(`${API}/nvr/ports`, async () => {
    await delay(250);
    return HttpResponse.json(poePorts);
  }),

  // 2 online -> error -> no_connection
  http.get(`${API}/cameras`, async () => {
    await delay(400);
    return HttpResponse.json(sortCameras(cameras));
  }),

  http.get(`${API}/cameras/:id`, async ({ params }) => {
    await delay(200);
    const camera = cameras.find((c) => c.id === params.id);
    if (!camera) {
      return errorResponse(404, { code: 'CAMERA_NOT_FOUND', message: 'Камера не найдена' });
    }
    return HttpResponse.json(camera);
  }),

  // Параметры WebRTC-подключения
  http.get(`${API}/cameras/:id/stream`, async ({ params }) => {
    const camera = cameras.find((c) => c.id === params.id);
    const failure = await guardCamera(camera);
    if (failure) return failure;

    await delay(300);
    const stream: StreamInfo = {
      cameraId: camera!.id,
      protocol: 'webrtc',
      whepUrl: whepUrl(camera!),
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      codec: camera!.codec!,
      resolution: camera!.resolution!,
      fps: camera!.fps!,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };
    return HttpResponse.json(stream);
  }),

  // WHEP signaling: SDP offer -> SDP answer
  http.post(`${API}/webrtc/:id/whep`, async ({ params, request }) => {
    const camera = cameras.find((c) => c.id === params.id);
    const failure = await guardCamera(camera);
    if (failure) return failure;

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/sdp') {
      return errorResponse(415, {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Ожидается Content-Type: application/sdp',
      });
    }

    await delay(400);
    return new HttpResponse(MOCK_SDP_ANSWER, {
      status: 201,
      headers: {
        'Content-Type': 'application/sdp',
        Location: `${API}/webrtc/${camera!.id}/whep/session-${Date.now()}`,
      },
    });
  }),

  // Завершение WHEP-сессии
  http.delete(`${API}/webrtc/:id/whep/:session`, () => new HttpResponse(null, { status: 200 })),
];