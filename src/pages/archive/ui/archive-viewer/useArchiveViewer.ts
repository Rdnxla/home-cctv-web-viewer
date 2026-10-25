import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback, useMemo} from 'react';
import {formatDuration} from '@/shared/lib/formatDuration';
import {formatCount} from '@/shared/lib/pluralize';
import {useNow} from '@/shared/lib/useNow';
import {useBookmarksQuery} from '@/api/bookmarks/bookmarkQueries';
import type {Camera} from '@/api/cameras/types';
import {PLAYBACK_SPEEDS} from '@/api/cameras/types';
import {useEventsInRangeQuery} from '@/api/events/eventQueries';
import type {NvrEvent} from '@/api/events/types';
import type {RecordingListResponse} from '@/api/recordings/types';
import type {TimeRange} from '../../lib/time';
import {formatClock, getEventSeekTime, SECOND_MS} from '../../lib/time';
import type {RecordingSegment} from '../../model/recordingSegments';
import {getCoverage, getRecordingSegments} from '../../model/recordingSegments';
import {useBookmarkForm} from './useBookmarkForm';
import type {Playback, PlaybackStatus} from './usePlayback';
import {usePlayback} from './usePlayback';
import {useTimeline} from './useTimeline';

const NOW_REFRESH_MS = 30_000;
const STEP_MS = 10 * SECOND_MS;
/** Событие, на котором уже стоим, не считается ни предыдущим, ни следующим */
const EVENT_TOLERANCE_MS = SECOND_MS;
const FILE_FORMS = {few: 'файла', many: 'файлов', one: 'файл'};
const NO_EVENTS: NvrEvent[] = [];

const STATUS_LABELS: Record<PlaybackStatus, string> = {
  connecting: 'Открытие записи…',
  ended: 'Воспроизведение остановлено',
  failed: 'Ошибка воспроизведения',
  idle: 'Момент не выбран',
  loading: 'Загрузка архива…',
  'no-recording': 'Нет записи',
  paused: 'Пауза',
  playing: 'Воспроизведение',
};

const dateFormat = new Intl.DateTimeFormat('ru', {day: '2-digit', month: '2-digit', year: 'numeric'});
const speedFormat = new Intl.NumberFormat('ru');

const SPEED_OPTIONS = PLAYBACK_SPEEDS.map(speed => ({label: `×${speedFormat.format(speed)}`, value: String(speed)}));

interface Placeholder {
  action: 'live' | 'retry' | null;
  description: string | null;
  icon: 'error' | 'history' | 'spinner' | 'video';
  title: string | null;
}

function getPlaceholder(playback: Playback): Placeholder {
  const {endReason, position, status, streamError} = playback;
  if (status === 'idle') {
    return {
      action: null,
      description: 'Нажмите на шкалу времени, событие или файл записи',
      icon: 'history',
      title: 'Выберите момент',
    };
  }
  if (status === 'loading') return {action: null, description: 'Загрузка архива…', icon: 'spinner', title: null};
  if (status === 'no-recording') {
    return {
      action: null,
      description: 'После выбранного момента в этот день камера ничего не записала',
      icon: 'history',
      title: 'Записи нет',
    };
  }
  if (endReason === 'live') {
    return {action: 'live', description: null, icon: 'video', title: 'Запись догнала текущее время'};
  }
  if (endReason === 'end') {
    return {
      action: null,
      description:
        position === null ? 'Дальше в архиве записей нет' : `После ${formatClock(position)} в архиве записей нет`,
      icon: 'history',
      title: 'Записи закончились',
    };
  }
  if (streamError) {
    return {action: 'retry', description: streamError.message, icon: 'error', title: 'Не удалось открыть запись'};
  }
  return {action: null, description: 'Открытие записи…', icon: 'spinner', title: null};
}

function getDaySummary(recordings: RecordingListResponse, segments: RecordingSegment[], now: number) {
  const {bounds, items} = recordings;
  if (segments.length === 0) {
    if (!bounds) return 'За этот день записей нет.';
    const from = dateFormat.format(Date.parse(bounds.from));
    const to = dateFormat.format(Date.parse(bounds.to));
    return `За этот день записей нет. В архиве есть записи с ${from} по ${to}.`;
  }
  const recordedMs = segments.reduce(
    (sum, segment) => sum + Math.max(0, Math.min(segment.end, now) - segment.start),
    0
  );
  return `Записано ${formatDuration(recordedMs)} · ${formatCount(items.length, FILE_FORMS)}`;
}

export interface ArchiveViewerProps {
  camera: Camera;
  day: TimeRange;
  moment: number | null;
  onOpenMoment: (time: number) => void;
  onSeek: (time: number) => void;
  recordingsQuery: UseQueryResult<RecordingListResponse>;
}

export function useArchiveViewer(props: ArchiveViewerProps) {
  const {camera, day, moment, onOpenMoment, onSeek, recordingsQuery} = props;
  const {data: recordings, error: recordingsError, refetch: refetchRecordings} = recordingsQuery;
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
  const dayEvents = eventsQuery.data?.items ?? NO_EVENTS;
  const playback = usePlayback({cameraId: camera.id, coverage, day, onSeek, target: moment});
  const {position, seek, setSpeed, speed, status, step} = playback;
  const bookmarkForm = useBookmarkForm(camera.id, position);
  const timeline = useTimeline({
    bookmarks: bookmarksQuery.data,
    day,
    events: dayEvents,
    now,
    onSeek: seek,
    position,
    segments,
  });

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
    refetchRecordings().catch(() => ({}));
  }, [refetchRecordings]);

  const getSnapshotDate = useCallback(() => new Date(position ?? Date.now()), [position]);

  const previousEvent =
    position === null ? null : dayEvents.findLast(event => getEventSeekTime(event) < position - EVENT_TOLERANCE_MS);
  const nextEvent =
    position === null ? null : dayEvents.find(event => getEventSeekTime(event) > position + EVENT_TOLERANCE_MS);

  const goToPreviousEvent = useCallback(() => {
    if (previousEvent) seek(getEventSeekTime(previousEvent));
  }, [previousEvent, seek]);

  const goToNextEvent = useCallback(() => {
    if (nextEvent) seek(getEventSeekTime(nextEvent));
  }, [nextEvent, seek]);

  const stepBack = useCallback(() => {
    step(-STEP_MS);
  }, [step]);

  const stepForward = useCallback(() => {
    step(STEP_MS);
  }, [step]);

  const changeSpeed = useCallback(
    (selected: string) => {
      const next = PLAYBACK_SPEEDS.find(item => String(item) === selected);
      if (next !== undefined) setSpeed(next);
    },
    [setSpeed]
  );

  return {
    bookmarkForm,
    bookmarksQuery,
    controls: {
      changeSpeed,
      clock: position === null ? '--:--:--' : formatClock(position),
      goToNextEvent,
      goToPreviousEvent,
      hasNextEvent: Boolean(nextEvent),
      hasPreviousEvent: Boolean(previousEvent),
      isActive: status === 'playing' || status === 'connecting',
      speed: String(speed),
      speedOptions: SPEED_OPTIONS,
      statusLabel: STATUS_LABELS[status],
      stepBack,
      stepForward,
    },
    eventsQuery,
    loadError: recordingsError && !recordings ? `Не удалось загрузить архив: ${recordingsError.message}` : null,
    now,
    openBookmark,
    playback,
    player: {
      badge: status === 'paused' ? 'АРХИВ · ПАУЗА' : `АРХИВ · ×${speedFormat.format(speed)}`,
      getSnapshotDate,
      isPaused: status === 'paused',
      placeholder: getPlaceholder(playback),
    },
    retryRecordings,
    summary: recordings && segments ? getDaySummary(recordings, segments, now) : null,
    timeline,
  };
}
