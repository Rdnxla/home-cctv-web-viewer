import {LinkBreak2Icon, VideoIcon} from '@radix-ui/react-icons';
import {AspectRatio, Flex, Grid, Skeleton} from '@radix-ui/themes';
import {useCallback, useMemo} from 'react';
import {useCamerasQuery} from '@/entities/camera';
import {useRecordingsQuery} from '@/entities/recording';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {LoadError} from '@/shared/ui';
import {getDayRange} from '../lib/time';
import {useArchiveParams} from '../model/useArchiveParams';
import {ArchiveEmptyState} from './ArchiveEmptyState';
import styles from './ArchivePage.module.scss';
import {ArchiveToolbar} from './ArchiveToolbar';
import {ArchiveViewer} from './ArchiveViewer';

const EMPTY_ICON_SIZE = 32;

function ArchiveSkeleton() {
  return (
    <Grid align='start' columns={CONTENT_WITH_ASIDE_COLUMNS} gap='4'>
      <Flex direction='column' gap='3'>
        <AspectRatio ratio={16 / 9}>
          <Skeleton height='100%' width='100%' />
        </AspectRatio>
        <Skeleton height='48px' width='100%' />
        <Skeleton height='110px' width='100%' />
      </Flex>
      <Skeleton height='420px' width='100%' />
    </Grid>
  );
}

/** Архив: записи камер за выбранный день, шкала времени с событиями и закладки */
export function Component() {
  const {openMoment, params, seek, selectCamera, selectDay} = useArchiveParams();
  const {data: cameras, error, isPending, refetch} = useCamerasQuery();
  const requestedId = params.cameraId ?? cameras?.[0]?.id ?? null;
  const camera = cameras?.find(item => item.id === requestedId);
  const cameraId = camera?.id ?? null;
  const day = useMemo(() => getDayRange(params.dayStart), [params.dayStart]);
  const recordingsParams = useMemo(
    () =>
      cameraId === null
        ? null
        : {cameraId, from: new Date(day.start).toISOString(), to: new Date(day.end).toISOString()},
    [cameraId, day]
  );
  const recordingsQuery = useRecordingsQuery(recordingsParams);

  const retryCameras = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  function renderContent() {
    if (camera) {
      return (
        <ArchiveViewer
          camera={camera}
          day={day}
          key={camera.id}
          moment={params.moment}
          onOpenMoment={openMoment}
          onSeek={seek}
          recordingsQuery={recordingsQuery}
        />
      );
    }
    if (isPending) return <ArchiveSkeleton />;
    if (error) {
      return <LoadError message={`Не удалось загрузить список камер: ${error.message}`} onRetry={retryCameras} />;
    }
    if (cameras.length === 0) {
      return (
        <ArchiveEmptyState
          description='Подключите камеру к PoE-порту регистратора — её записи появятся здесь.'
          icon={<VideoIcon aria-hidden='true' height={EMPTY_ICON_SIZE} width={EMPTY_ICON_SIZE} />}
          title='Камеры не подключены'
        />
      );
    }
    return (
      <ArchiveEmptyState
        description='На устройстве нет такой камеры. Выберите камеру из списка.'
        icon={<LinkBreak2Icon aria-hidden='true' height={EMPTY_ICON_SIZE} width={EMPTY_ICON_SIZE} />}
        title='Камера не найдена'
      />
    );
  }

  return (
    <section className={styles.archivePage}>
      <title>{camera ? `Архив — ${camera.name}` : 'Архив'}</title>
      <Flex direction='column' gap='4'>
        <ArchiveToolbar
          bounds={recordingsQuery.data?.bounds}
          cameraId={cameraId}
          cameras={cameras}
          dayStart={params.dayStart}
          onCameraChange={selectCamera}
          onDayChange={selectDay}
        />
        {renderContent()}
      </Flex>
    </section>
  );
}
