import {DataList, Flex, Skeleton, Text} from '@radix-ui/themes';
import {useCallback} from 'react';
import type {Camera, CameraStatus} from '@/entities/camera';
import {CAMERA_STATUSES} from '@/shared/model/status';
import {CameraStatusBadge} from '@/shared/ui/cam-status-badge/CameraStatusBadge';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import {InlineError} from '@/shared/ui';

function countByStatus(cameras: Camera[]) {
  const counts: Record<CameraStatus, number> = {error: 0, no_connection: 0, online: 0};
  for (const camera of cameras) counts[camera.status] += 1;
  return counts;
}

export function CameraSummary() {
  const {data: cameras, isPending, refetch} = useCamerasQuery();

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  if (!cameras) {
    if (isPending)
      return (
        <Skeleton
          height='96px'
          width='100%'
        />
      );
    return (
      <InlineError
        message='Не удалось загрузить камеры'
        onRetry={retry}
      />
    );
  }

  const counts = countByStatus(cameras);

  return (
    <Flex
      direction='column'
      gap='4'
    >
      <Text size='4'>
        {`${counts.online} из ${cameras.length} в сети`}
      </Text>
      <DataList.Root size='1'>
        {CAMERA_STATUSES.map(status => (
          <DataList.Item
            align='center'
            key={status}
          >
            <DataList.Label minWidth='140px'>
              <CameraStatusBadge status={status} />
            </DataList.Label>
            <DataList.Value>{counts[status]}</DataList.Value>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Flex>
  );
}
