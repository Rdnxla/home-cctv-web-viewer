import {apiFetch} from '@/shared/api/http';
import type {Camera, CameraPlaybackParams, StreamInfo} from './types';

const CAMERAS_URL = '/api/cameras';

function getCameras() {
  return apiFetch<Camera[]>(CAMERAS_URL);
}

function getCamera(id: string) {
  return apiFetch<Camera>(`${CAMERAS_URL}/${encodeURIComponent(id)}`);
}

function getCameraStream(id: string) {
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/stream`);
}

function getCameraPlayback(id: string, params: CameraPlaybackParams) {
  const search = new URLSearchParams({from: params.from, speed: String(params.speed)});
  return apiFetch<StreamInfo>(`${CAMERAS_URL}/${encodeURIComponent(id)}/playback?${search.toString()}`);
}

export {getCamera, getCameraPlayback, getCameraStream, getCameras};
