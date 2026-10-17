import {useQuery, useQueryClient} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import type {Camera} from '../model/types';
import {getCamera, getCameraStream, getCameras} from './cameraApi';

const CAMERAS_KEY = 'cameras';

/** Ключи начинаются с имени сущности: `invalidateQueries({queryKey: cameraKeys.all})` сбрасывает всё по камерам */
export const cameraKeys = {
  all: [CAMERAS_KEY] as const,
  detail: (id: string) => [CAMERAS_KEY, 'detail', id] as const,
  list: () => [CAMERAS_KEY, 'list'] as const,
  stream: (id: string) => [CAMERAS_KEY, 'stream', id] as const,
};

export function useCamerasQuery() {
  return useQuery({
    queryFn: getCameras,
    queryKey: cameraKeys.list(),
    retry: retryUnlessClientError,
  });
}

export function useCameraQuery(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    // Камера из уже загруженного списка показывается сразу, пока догружается детальная карточка
    placeholderData: () => queryClient.getQueryData<Camera[]>(cameraKeys.list())?.find(camera => camera.id === id),
    queryFn: () => getCamera(id),
    queryKey: cameraKeys.detail(id),
    retry: retryUnlessClientError,
  });
}

export function useCameraStreamQuery(id: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getCameraStream(id),
    queryKey: cameraKeys.stream(id),
    // Плеер переподключается только при смене whepUrl, частые перезапросы параметров не нужны
    refetchOnWindowFocus: false,
    retry: retryUnlessClientError,
  });
}
