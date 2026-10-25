import {ArrowRightIcon} from '@radix-ui/react-icons';
import {Card, Flex, Link} from '@radix-ui/themes';
import {Link as RouterLink} from 'react-router';
import {CameraLiveView} from '@/entities/camera';
import {ROUTES} from '@/shared/config/routes';
import {CameraStatusBadge} from '@/shared/ui/cam-status-badge/CameraStatusBadge';
import type {Camera} from '@/api/cameras/types';

interface CameraGridCardProps {
  camera: Camera;
}

export function CameraGridCard(props: CameraGridCardProps) {
  const {camera} = props;
  const detailPath = ROUTES.cameraDetail(camera.id);

  return (
    <Card size='1'>
      <Flex
        direction='column'
        gap='2'
      >
        <Link
          asChild
          size='2'
          truncate
          weight='medium'
        >
          <RouterLink to={detailPath}>
            <Flex
              align='center'
              gap='2'
              justify='between'
            >
              <Flex
                align='center'
                gap='2'
                minWidth='0'
              >
                {camera.name}
                <CameraStatusBadge status={camera.status} />
              </Flex>
              <ArrowRightIcon />
            </Flex>
          </RouterLink>
        </Link>
        <CameraLiveView camera={camera} />
      </Flex>
    </Card>
  );
}
