import {delay, HttpResponse, http} from 'msw';
import {cameras, getNvrInfo, poePorts, sortCameras, whepUrl} from '../data/nvr';
import type {ApiErrorBody, Camera, StreamInfo} from '../data/nvrtypes';
import {closeMockWhepSession, createMockWhepSession} from './mockWhep';

const API = '/api';

const errorResponse = (status: number, body: ApiErrorBody) => HttpResponse.json(body, {status});

/**
 * Общая проверка доступности камеры для /stream и /whep.
 * Возвращает Response с ошибкой или null, если камера online.
 */
async function guardCamera(camera: Camera | undefined) {
  if (!camera) {
    await delay(200);
    return errorResponse(404, {code: 'CAMERA_NOT_FOUND', message: 'Камера не найдена'});
  }
  if (camera.status === 'error') {
    await delay(3000); // эмуляция долгого таймаута
    return errorResponse(504, camera.error ?? {code: 'CONNECTION_ERROR', message: 'Ошибка подключения к камере'});
  }
  if (camera.status === 'no_connection') {
    await delay(300);
    return errorResponse(404, {
      code: 'NO_CONNECTION',
      message: `К порту ${camera.portId} камера не подключена`,
    });
  }
  return undefined;
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

  http.get(`${API}/cameras`, async () => {
    await delay(5000);
    return HttpResponse.json(sortCameras(cameras));
  }),

  http.get(`${API}/cameras/:id`, async ({params}) => {
    await delay(200);
    const camera = cameras.find(c => c.id === params.id);
    if (!camera) {
      return errorResponse(404, {code: 'CAMERA_NOT_FOUND', message: 'Камера не найдена'});
    }
    return HttpResponse.json(camera);
  }),

  // Параметры WebRTC-подключения
  http.get(`${API}/cameras/:id/stream`, async ({params}) => {
    const camera = cameras.find(c => c.id === params.id);
    const failure = await guardCamera(camera);
    if (failure || !camera) return failure;

    await delay(5000);
    const stream: StreamInfo = {
      cameraId: camera.id,
      codec: camera.codec,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      fps: camera.fps,
      iceServers: [],
      protocol: 'webrtc',
      resolution: camera.resolution,
      whepUrl: whepUrl(camera),
    };
    return HttpResponse.json(stream);
  }),

  // WHEP signaling: SDP offer -> SDP answer
  http.post(`${API}/webrtc/:id/whep`, async ({params, request}) => {
    const camera = cameras.find(c => c.id === params.id);
    const failure = await guardCamera(camera);
    if (failure || !camera) return failure;

    const contentType = request.headers.get('content-type');
    if (contentType !== 'application/sdp') {
      return errorResponse(415, {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Ожидается Content-Type: application/sdp',
      });
    }

    const offer = await request.text();
    const {sessionId, answerSdp} = await createMockWhepSession(offer, camera.name);

    return new HttpResponse(answerSdp, {
      headers: {
        'Content-Type': 'application/sdp',
        Location: `${API}/webrtc/${camera.id}/whep/${sessionId}`,
      },
      status: 201,
    });
  }),

  // Завершение WHEP-сессии
  http.delete(`${API}/webrtc/:id/whep/:session`, ({params}) => {
    closeMockWhepSession(String(params.session));
    return new HttpResponse(null, {status: 200});
  }),
];
