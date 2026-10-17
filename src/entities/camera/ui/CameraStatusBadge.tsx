import {Badge} from '@radix-ui/themes';
import {CAMERA_STATUS_META} from '../model/status';
import type {CameraStatus} from '../model/types';
import styles from './CameraStatusBadge.module.scss';

interface CameraStatusBadgeProps {
  size?: '1' | '2' | undefined;
  status: CameraStatus;
}

export function CameraStatusBadge(props: CameraStatusBadgeProps) {
  const {size = '1', status} = props;
  const meta = CAMERA_STATUS_META[status];

  return (
    <Badge color={meta.color} radius='full' size={size} variant='soft'>
      <span aria-hidden='true' className={styles.cameraStatusBadge__dot} />
      {meta.label}
    </Badge>
  );
}
