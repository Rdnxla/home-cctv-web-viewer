import {useCallback} from 'react';
import {useCameraStreamQuery} from '@/api/cameras/cameraQueries';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import type {Camera} from '../model/types';
import {CameraPlayer} from './CameraPlayer';
import {StreamPlaceholder} from './StreamPlaceholder';

interface CameraLiveViewProps {
  camera: Camera;
  className?: string | undefined;
}

export function CameraLiveView(props: CameraLiveViewProps) {
  const showMessage = useCalloutMessage();
  const {camera, className} = props;
  const isOnline = camera.status === 'online';
  const {data: stream, error, refetch} = useCameraStreamQuery(camera.id, isOnline);

  const retryStream = useCallback(() => {
    refetch().catch((e) => (showMessage(e, 'error')));
  }, [refetch, showMessage]);

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
