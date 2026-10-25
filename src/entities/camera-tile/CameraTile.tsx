import {Card, Flex, Inset, Text} from '@radix-ui/themes';
import {Link} from 'react-router';
import {CameraStatusBadge} from '@/shared/ui/cam-status-badge/CameraStatusBadge';
import {CameraStatusIcon} from '@/shared/ui/cam-status-icon/CameraStatusIcon';
import type {Camera} from '@/api/cameras/types';
import styles from './CameraTile.module.scss';

interface CameraTileProps {
  camera: Camera;
  to: string;
}

export function CameraTile(props: CameraTileProps) {
  const {camera, to} = props;

  return (
    <Card
      asChild
      className={styles.cameraTile}
      size='1'
    >
      <Link to={to}>
        <Inset
          clip='padding-box'
          pb='current'
          side='top'
        >
          <Flex
            align='center'
            className={styles.cameraTile__preview}
            justify='center'
          >
            <CameraStatusIcon status={camera.status} />
          </Flex>
        </Inset>
        <Flex
          direction='column'
          gap='1'
        >
          <Text
            size='2'
            truncate
            weight='medium'
          >
            {camera.name}
          </Text>
          <Flex
            align='center'
            gap='2'
            justify='between'
          >
            <CameraStatusBadge status={camera.status} />
            <Text
              color='gray'
              size='1'
            >
              {`Порт ${camera.portId}`}
            </Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
}
