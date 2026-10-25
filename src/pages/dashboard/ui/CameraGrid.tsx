import {VideoIcon} from '@radix-ui/react-icons';
import {AspectRatio, Flex, Grid, Skeleton, Text} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback} from 'react';
import {LoadError} from '@/shared/ui';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import type {Camera} from '@/api/cameras/types';
import {CameraGridCard} from './CameraGridCard';

const GRID_COLUMNS = {initial: '1', sm: '2'};
const SKELETON_KEYS = ['camera-skeleton-1', 'camera-skeleton-2', 'camera-skeleton-3', 'camera-skeleton-4'];

interface CameraGridProps {
  cameras: Camera[] | undefined;
  error: Error | null;
  isPending: boolean;
  refetch: UseQueryResult<Camera[]>['refetch'];
}

export function CameraGrid(props: CameraGridProps) {
  const {cameras, error, isPending, refetch} = props;
  const showMessage = useCalloutMessage();

  const retry = useCallback(() => {
    refetch().catch(e => showMessage(e, 'error'));
  }, [refetch, showMessage]);

  if (cameras && cameras.length === 0) {
    return (
      <Flex
        align='center'
        direction='column'
        gap='2'
        py='8'
      >
        <Text
          as='span'
          color='gray'
        >
          <VideoIcon
            aria-hidden='true'
            height={32}
            width={32}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Камеры не подключены
        </Text>
        <Text
          color='gray'
          size='2'
        >
          Подключите камеру к PoE-порту регистратора — она появится здесь автоматически.
        </Text>
      </Flex>
    );
  }

  if (cameras) {
    return (
      <Grid
        columns={GRID_COLUMNS}
        gap='3'
      >
        {cameras.map(camera => (
          <CameraGridCard
            camera={camera}
            key={camera.id}
          />
        ))}
      </Grid>
    );
  }

  if (isPending) {
    return (
      <Grid
        columns={GRID_COLUMNS}
        gap='3'
      >
        {SKELETON_KEYS.map(key => (
          <AspectRatio
            key={key}
            ratio={16 / 9}
          >
            <Skeleton
              height='100%'
              width='100%'
            />
          </AspectRatio>
        ))}
      </Grid>
    );
  }

  return (
    <LoadError
      message={`Не удалось загрузить список камер: ${error?.message ?? 'неизвестная ошибка'}`}
      onRetry={retry}
    />
  );
}
