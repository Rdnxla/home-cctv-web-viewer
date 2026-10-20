import {ExclamationTriangleIcon, LinkBreak2Icon, VideoIcon} from '@radix-ui/react-icons';
import {Text} from '@radix-ui/themes';
import {CAMERA_STATUS_META} from '../model/status';
import type {CameraStatus} from '../model/types';

const STATUS_ICONS: Record<CameraStatus, typeof VideoIcon> = {
  error: ExclamationTriangleIcon,
  no_connection: LinkBreak2Icon,
  online: VideoIcon,
};

interface CameraStatusIconProps {
  size?: number | undefined;
  status: CameraStatus;
}

export function CameraStatusIcon(props: CameraStatusIconProps) {
  const {size = 24, status} = props;
  const Icon = STATUS_ICONS[status];

  return (
    <Text
      as='span'
      color={CAMERA_STATUS_META[status].color}
    >
      <Icon
        aria-hidden='true'
        height={size}
        width={size}
      />
    </Text>
  );
}
