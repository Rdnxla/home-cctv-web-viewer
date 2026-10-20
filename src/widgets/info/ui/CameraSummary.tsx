import {DataList, Flex, Skeleton, Text} from '@radix-ui/themes';
import {useCallback} from 'react';
import type {Camera, CameraStatus} from '@/entities/camera';
import {CAMERA_STATUSES, CameraStatusBadge, useCamerasQuery} from '@/entities/camera';
import {InlineError} from '@/shared/ui';

function countByStatus(cameras: Camera[]) {
  const counts: Record<CameraStatus, number> = {error: 0, no_connection: 0, online: 0};
  for (const camera of cameras) counts[camera.status] += 1;
  return counts;
}

/** Сводка по камерам: сколько в сети и разбивка по статусам */
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
      gap='3'
    >
      <Flex direction='column'>
        <Text
          color='gray'
          size='2'
        >
          Камеры в сети
        </Text>
        <Text
          size='7'
          weight='bold'
        >
          {`${counts.online} из ${cameras.length}`}
        </Text>
      </Flex>
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
