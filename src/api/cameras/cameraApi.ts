import {apiFetch} from '@/shared/api/http';
import type {Camera, CameraPlaybackParams, StreamInfo} from './types';

const CAMERAS_URL = '/api/cameras';

export function getCameras() {
  return apiFetch<Camera[]>(CAMERAS_URL);
}

export function getCamera(id: string) {
  return apiFetch<Camera>(`${CAMERAS_URL}/${encodeURIComponent(id)}`);
}

export function getCameraStream(id: string) {
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/stream`);
}

export function getCameraPlayback(id: string, params: CameraPlaybackParams) {
  const search = new URLSearchParams({from: params.from, speed: String(params.speed)});
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/playback?${search.toString()}`);
}
