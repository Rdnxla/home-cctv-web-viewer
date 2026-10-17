import {Flex, Grid, Heading, Text} from '@radix-ui/themes';
import {CameraControls} from '@/widgets/camera-control';
import type {Camera} from '@/entities/camera';
import {CameraLiveView, CameraStatusBadge} from '@/entities/camera';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {OtherCameras} from './OtherCameras';

interface CameraViewProps {
  camera: Camera;
}

/** Загруженная камера: заголовок, плеер, другие камеры и панель сведений */
export function CameraView(props: CameraViewProps) {
  const {camera} = props;
  const subtitle = camera.model ? `${camera.model} · порт ${camera.portId}` : `Порт ${camera.portId}`;

  return (
    <>
      <title>{`${camera.name} — Камеры`}</title>
      <Flex align='center' gap='3' wrap='wrap'>
        <Heading as='h2' size='6'>
          {camera.name}
        </Heading>
        <CameraStatusBadge size='2' status={camera.status} />
        <Text color='gray' size='2'>
          {subtitle}
        </Text>
      </Flex>
      <Grid align='start' columns={CONTENT_WITH_ASIDE_COLUMNS} gap='4'>
        <Flex direction='column' gap='4' minWidth='0'>
          <CameraLiveView camera={camera} key={camera.id} />
          <OtherCameras currentId={camera.id} />
        </Flex>
        <CameraControls camera={camera} />
      </Grid>
    </>
  );
}
