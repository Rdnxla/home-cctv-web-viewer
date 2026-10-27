import {CounterClockwiseClockIcon} from '@radix-ui/react-icons';
import {Button, Flex, Heading} from '@radix-ui/themes';
import {Link as RouterLink} from 'react-router';
import {CameraControls} from '@/widgets/camera-control';
import {CameraLiveView} from '@/entities/camera';
import {ROUTES} from '@/shared/config/routes';
import {MediaWithAside} from '@/shared/ui';
import {CameraStatusBadge} from '@/shared/ui/cam-status-badge/CameraStatusBadge';
import type {Camera} from '@/api/cameras/types';
import {OtherCameras} from './OtherCameras';

interface CameraViewProps {
  camera: Camera;
}

export function CameraView(props: CameraViewProps) {
  const {camera} = props;

  return (
    <>
      <title>{`${camera.name} — Камеры`}</title>
      <Flex
        align='center'
        gap='3'
        wrap='wrap'
      >
        <Heading
          as='h2'
          size='3'
        >
          {camera.name}
        </Heading>
        <CameraStatusBadge
          size='2'
          status={camera.status}
        />
        <Button
          asChild
          color='gray'
          ml='auto'
          variant='soft'
        >
          <RouterLink to={ROUTES.cameraArchive(camera.id)}>
            <CounterClockwiseClockIcon />
            Архив
          </RouterLink>
        </Button>
      </Flex>
      <MediaWithAside
        aside={<CameraControls camera={camera} />}
        mainGap='4'
        media={
          <CameraLiveView
            camera={camera}
            key={camera.id}
          />
        }
      >
        <OtherCameras currentId={camera.id} />
      </MediaWithAside>
    </>
  );
}
