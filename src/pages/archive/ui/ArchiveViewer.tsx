import {CounterClockwiseClockIcon} from '@radix-ui/react-icons';
import {Button, Flex, Grid, Text} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback, useMemo} from 'react';
import {Link as RouterLink} from 'react-router';
import {useBookmarksQuery} from '@/entities/bookmark';
import type {Camera} from '@/entities/camera';
import type {NvrEvent} from '@/entities/event';
import {useEventsInRangeQuery} from '@/entities/event';
import type {ArchiveBounds, RecordingListResponse} from '@/entities/recording';
import {CONTENT_WITH_ASIDE_COLUMNS} from '@/shared/config/layout';
import {ROUTES} from '@/shared/config/routes';
import {formatDuration} from '@/shared/lib/formatDuration';
import {formatCount} from '@/shared/lib/pluralize';
import {useNow} from '@/shared/lib/useNow';
import {LoadError} from '@/shared/ui';
import type {RecordingSegment} from '../lib/coverage';
import {getCoverage, getRecordingSegments} from '../lib/coverage';
import {formatDate} from '../lib/format';
import type {TimeRange} from '../lib/time';
import {usePlayback} from '../model/usePlayback';
import {ArchiveEmptyState} from './ArchiveEmptyState';
import {ArchivePlayer} from './ArchivePlayer';
import {ArchiveSidebar} from './ArchiveSidebar';
import {PlaybackControls} from './PlaybackControls';
import {Timeline} from './Timeline';

/** Как часто сдвигается «сейчас» на шкале и в длительности файла, который пишется */
const NOW_REFRESH_MS = 30_000;
const EMPTY_ICON_SIZE = 32;
const FILE_FORMS = {few: 'файла', many: 'файлов', one: 'файл'};
const NO_EVENTS: NvrEvent[] = [];

interface DaySummaryProps {
  bounds: ArchiveBounds | null;
  fileCount: number;
  now: number;
  segments: RecordingSegment[];
}

function DaySummary(props: DaySummaryProps) {
  const {bounds, fileCount, now, segments} = props;

  if (segments.length === 0) {
    return (
      <Text color='gray' size='2'>
        {bounds
          ? `За этот день записей нет. В архиве есть записи с ${formatDate(Date.parse(bounds.from))} по ${formatDate(Date.parse(bounds.to))}.`
          : 'За этот день записей нет.'}
      </Text>
    );
  }

  const recordedMs = segments.reduce(
    (sum, segment) => sum + Math.max(0, Math.min(segment.end, now) - segment.start),
    0
  );

  return (
    <Text color='gray' size='2'>
      {`Записано ${formatDuration(recordedMs)} · ${formatCount(fileCount, FILE_FORMS)}`}
    </Text>
  );
}

interface ArchiveViewerProps {
  camera: Camera;
  day: TimeRange;
  /** Момент из URL */
  moment: number | null;
  /** Переход к моменту с записью в историю (закладка на другой день) */
  onOpenMoment: (time: number) => void;
  /** Перемотка: момент заменяет текущий в URL */
  onSeek: (time: number) => void;
  recordingsQuery: UseQueryResult<RecordingListResponse>;
}

/** Архив выбранной камеры за день: плеер, управление, шкала времени и боковая панель */
export function ArchiveViewer(props: ArchiveViewerProps) {
  const {camera, day, moment, onOpenMoment, onSeek, recordingsQuery} = props;
  const {data: recordings, error, refetch} = recordingsQuery;
  const now = useNow(NOW_REFRESH_MS);

  const segments = useMemo(
    () => (recordings ? getRecordingSegments(recordings.items, day) : undefined),
    [day, recordings]
  );
  const coverage = useMemo(() => (segments ? getCoverage(segments) : undefined), [segments]);
  const rangeParams = useMemo(
    () => ({cameraId: camera.id, from: new Date(day.start).toISOString(), to: new Date(day.end).toISOString()}),
    [camera.id, day]
  );

  const eventsQuery = useEventsInRangeQuery(rangeParams);
  const bookmarksQuery = useBookmarksQuery(camera.id);
  const playback = usePlayback({cameraId: camera.id, coverage, day, onSeek, target: moment});
  const {position, seek} = playback;
  const dayEvents = eventsQuery.data?.items ?? NO_EVENTS;
  const bookmarks = bookmarksQuery.data;

  const dayBookmarks = useMemo(
    () =>
      (bookmarks ?? []).filter(bookmark => {
        const time = Date.parse(bookmark.at);
        return time >= day.start && time < day.end;
      }),
    [bookmarks, day]
  );

  const openBookmark = useCallback(
    (time: number) => {
      // В пределах дня — перемотка, на другой день — переход с записью в историю
      if (time >= day.start && time < day.end) {
        seek(time);
      } else {
        onOpenMoment(time);
      }
    },
    [day, onOpenMoment, seek]
  );

  const retryRecordings = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  if (recordings?.bounds === null) {
    return (
      <ArchiveEmptyState
        description='Записи появятся, когда камера начнёт передавать видео на регистратор.'
        icon={<CounterClockwiseClockIcon aria-hidden='true' height={EMPTY_ICON_SIZE} width={EMPTY_ICON_SIZE} />}
        title={`В архиве нет записей камеры «${camera.name}»`}
      >
        <Button asChild mt='2' variant='soft'>
          <RouterLink to={ROUTES.cameraDetail(camera.id)}>Открыть камеру</RouterLink>
        </Button>
      </ArchiveEmptyState>
    );
  }

  return (
    <Grid align='start' columns={CONTENT_WITH_ASIDE_COLUMNS} gap='4'>
      <Flex direction='column' gap='3' minWidth='0'>
        {error && !recordings ? (
          <LoadError message={`Не удалось загрузить архив: ${error.message}`} onRetry={retryRecordings} />
        ) : (
          <>
            <ArchivePlayer camera={camera} playback={playback} />
            <PlaybackControls camera={camera} events={dayEvents} playback={playback} />
            <Timeline
              bookmarks={dayBookmarks}
              day={day}
              events={dayEvents}
              now={now}
              onSeek={seek}
              position={position}
              segments={segments}
            />
            {recordings && segments ? (
              <DaySummary
                bounds={recordings.bounds}
                fileCount={recordings.items.length}
                now={now}
                segments={segments}
              />
            ) : null}
          </>
        )}
      </Flex>
      <ArchiveSidebar
        bookmarksQuery={bookmarksQuery}
        day={day}
        eventsQuery={eventsQuery}
        now={now}
        onOpenBookmark={openBookmark}
        onSeek={seek}
        position={position}
        recordingsQuery={recordingsQuery}
      />
    </Grid>
  );
}
