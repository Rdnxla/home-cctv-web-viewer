import {apiFetch} from '@/shared/api/http';
import type {Camera, StreamInfo} from '../model/types';

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
