import {skipToken, useQuery, useQueryClient} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import {getCamera, getCameraPlayback, getCameraStream, getCameras} from './cameraApi';
import type {Camera, CameraPlaybackParams} from './types';

const CAMERAS_KEY = 'cameras';

const cameraKeys = {
  all: [CAMERAS_KEY] as const,
  detail: (id: string) => [CAMERAS_KEY, 'detail', id] as const,
  list: () => [CAMERAS_KEY, 'list'] as const,
  playback: (id: string, params: CameraPlaybackParams | null) => [CAMERAS_KEY, 'playback', id, params] as const,
  stream: (id: string) => [CAMERAS_KEY, 'stream', id] as const,
};

function useCamerasQuery() {
  return useQuery({
    queryFn: getCameras,
    queryKey: cameraKeys.list(),
    retry: retryUnlessClientError,
  });
}

function useCameraQuery(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    placeholderData: () => queryClient.getQueryData<Camera[]>(cameraKeys.list())?.find(camera => camera.id === id),
    queryFn: () => getCamera(id),
    queryKey: cameraKeys.detail(id),
    retry: retryUnlessClientError,
  });
}

function useCameraStreamQuery(id: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getCameraStream(id),
    queryKey: cameraKeys.stream(id),
    refetchOnWindowFocus: false,
    retry: retryUnlessClientError,
  });
}

function useCameraPlaybackQuery(id: string, params: CameraPlaybackParams | null) {
  return useQuery({
    queryFn: params === null ? skipToken : () => getCameraPlayback(id, params),
    queryKey: cameraKeys.playback(id, params),
    refetchOnWindowFocus: false,
    retry: retryUnlessClientError,
  });
}

export {cameraKeys, useCameraPlaybackQuery, useCameraQuery, useCameraStreamQuery, useCamerasQuery};
