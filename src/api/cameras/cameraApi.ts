import {apiFetch} from '@/shared/api/http';
import type {CameraPlaybackParams} from './types';
import type {Camera, StreamInfo} from './types';

const CAMERAS_URL = '/api/cameras';

export function getCameras() {
  return apiFetch<Camera[]>(CAMERAS_URL);
}

export function getCamera(id: string) {
  return apiFetch<Camera>(`${CAMERAS_URL}/${encodeURIComponent(id)}`);
}

/** Параметры WebRTC-подключения (WHEP). Для камер не в сети отвечает ошибкой. */
export function getCameraStream(id: string) {
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/stream`);
}

/** Параметры WebRTC-подключения (WHEP) к архиву с момента `from`. Если в этот момент записи нет — 404. */
export function getCameraPlayback(id: string, params: CameraPlaybackParams) {
  const search = new URLSearchParams({from: params.from, speed: String(params.speed)});
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/playback?${search.toString()}`);
}
