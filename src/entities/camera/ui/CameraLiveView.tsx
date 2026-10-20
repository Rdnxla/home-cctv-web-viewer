import {useCallback} from 'react';
import {useCameraStreamQuery} from '../api/cameraQueries';
import type {Camera} from '../model/types';
import {CameraPlayer} from './CameraPlayer';
import {StreamPlaceholder} from './StreamPlaceholder';

interface CameraLiveViewProps {
  camera: Camera;
  className?: string | undefined;
}

/**
 * Живое видео конкретной камеры: запрашивает параметры потока и подключает плеер.
 * Для камер не в сети поток не запрашивается (`/stream` для них отвечает ошибкой) — вместо видео причина.
 * Потребитель ставит `key={camera.id}`, чтобы при смене камеры WHEP-сессия пересоздавалась.
 */
export function CameraLiveView(props: CameraLiveViewProps) {
  const {camera, className} = props;
  const isOnline = camera.status === 'online';
  const {data: stream, error, refetch} = useCameraStreamQuery(camera.id, isOnline);

  const retryStream = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  return (
    <CameraPlayer
      className={className}
      fallback={
        <StreamPlaceholder
          camera={camera}
          error={error}
          onRetry={retryStream}
        />
      }
      stream={isOnline ? stream : undefined}
      title={camera.name}
    />
  );
}
