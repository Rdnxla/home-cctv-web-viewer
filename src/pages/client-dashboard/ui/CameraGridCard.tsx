import {ArrowRightIcon} from '@radix-ui/react-icons';
import {Card, Flex, IconButton, Link, Tooltip} from '@radix-ui/themes';
import {Link as RouterLink} from 'react-router';
import type {Camera} from '@/entities/camera';
import {CameraLiveView, CameraStatusBadge} from '@/entities/camera';
import {ROUTES} from '@/shared/config/routes';

interface CameraGridCardProps {
  camera: Camera;
}

/** Ячейка сетки живого просмотра: название со статусом, видео камеры и переход к её странице */
export function CameraGridCard(props: CameraGridCardProps) {
  const {camera} = props;
  const detailPath = ROUTES.cameraDetail(camera.id);

  return (
    <Card size='1'>
      <Flex direction='column' gap='2'>
        <Flex align='center' gap='2' justify='between'>
          <Flex align='center' gap='2' minWidth='0'>
            <Link asChild size='2' truncate weight='medium'>
              <RouterLink to={detailPath}>{camera.name}</RouterLink>
            </Link>
            <CameraStatusBadge status={camera.status} />
          </Flex>
          <Tooltip content='Открыть камеру'>
            <IconButton aria-label={`Открыть камеру «${camera.name}»`} asChild color='gray' size='1' variant='ghost'>
              <RouterLink to={detailPath}>
                <ArrowRightIcon />
              </RouterLink>
            </IconButton>
          </Tooltip>
        </Flex>
        <CameraLiveView camera={camera} />
      </Flex>
    </Card>
  );
}
