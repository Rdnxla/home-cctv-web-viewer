import {Badge, Flex, Heading, ScrollArea, Skeleton} from '@radix-ui/themes';
import {useCallback, useId} from 'react';
import type {Camera} from '@/entities/camera';
import {CameraTile} from '@/entities/camera-tile/CameraTile';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import {ROUTES} from '@/shared/config/routes';
import {InlineError} from '@/shared/ui';

const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3'];

interface OtherCamerasContentProps {
  cameras: Camera[] | undefined;
  isPending: boolean;
  onRetry: () => void;
}

function OtherCamerasContent(props: OtherCamerasContentProps) {
  const {cameras, isPending, onRetry} = props;

  if (cameras) {
    return (
      <ScrollArea
        scrollbars='horizontal'
        type='auto'
      >
        <Flex
          gap='3'
          pb='3'
        >
          {cameras.map(camera => (
            <CameraTile
              camera={camera}
              key={camera.id}
              to={ROUTES.cameraDetail(camera.id)}
            />
          ))}
        </Flex>
      </ScrollArea>
    );
  }

  if (isPending) {
    return (
      <Flex
        gap='3'
        pb='3'
      >
        {SKELETON_KEYS.map(key => (
          <Skeleton
            height='170px'
            key={key}
            width='200px'
          />
        ))}
      </Flex>
    );
  }

  return (
    <InlineError
      message='Не удалось загрузить список камер'
      onRetry={onRetry}
    />
  );
}

interface OtherCamerasProps {
  currentId: string;
}

/** Быстрое переключение на другие камеры устройства */
export function OtherCameras(props: OtherCamerasProps) {
  const {currentId} = props;
  const headingId = useId();
  const {data, isPending, refetch} = useCamerasQuery();
  const others = data?.filter(camera => camera.id !== currentId);

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  if (others?.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <Flex
        align='center'
        gap='2'
        mb='3'
      >
        <Heading
          as='h3'
          id={headingId}
          size='4'
        >
          Другие камеры
        </Heading>
        {others ? (
          <Badge
            color='gray'
            radius='full'
          >
            {others.length}
          </Badge>
        ) : null}
      </Flex>
      <OtherCamerasContent
        cameras={others}
        isPending={isPending}
        onRetry={retry}
      />
    </section>
  );
}
