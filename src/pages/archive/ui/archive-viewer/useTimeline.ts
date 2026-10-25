import type {PointerEvent} from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {isOneOf} from '@/shared/lib/isOneOf';
import type {Bookmark} from '@/api/bookmarks/types';
import type {NvrEvent} from '@/api/events/types';
import type {TimeRange} from '../../lib/time';
import {formatClock, formatDateTime, HOUR_MS, MINUTE_MS, SECOND_MS} from '../../lib/time';
import type {RecordingSegment} from '../../model/recordingSegments';

const TICK_EDGE_PERCENT = 3;
/** Самый короткий отрезок записи всё равно виден (≈2 px на ширине 1000 px) */
const MIN_SEGMENT_PERCENT = 0.2;
/** Стрелки клавиатуры подтверждают каждое нажатие — переходим, когда пользователь остановился */
const COMMIT_DELAY_MS = 300;
const TIMELINE_ZOOMS = ['24h', '6h', '1h', '15m'] as const;

const shortClockFormat = new Intl.DateTimeFormat('ru', {hour: '2-digit', minute: '2-digit'});

type TimelineZoom = (typeof TIMELINE_ZOOMS)[number];

interface TimelineZoomMeta {
  durationMs: number;
  label: string;
  stepMs: number;
  tickMs: number;
}

interface ScrubState {
  value: number;
  /** Пока ползунок тянут, шкала не сдвигается под пальцем */
  view: TimeRange;
}

interface TimelineTick {
  label: string;
  time: number;
  x: string;
}

interface UseTimelineOptions {
  bookmarks: Bookmark[] | undefined;
  day: TimeRange;
  events: NvrEvent[];
  now: number;
  onSeek: (time: number) => void;
  position: number | null;
  segments: RecordingSegment[] | undefined;
}

const TIMELINE_ZOOM_META: Record<TimelineZoom, TimelineZoomMeta> = {
  '1h': {durationMs: HOUR_MS, label: '1 ч', stepMs: SECOND_MS, tickMs: 10 * MINUTE_MS},
  '6h': {durationMs: 6 * HOUR_MS, label: '6 ч', stepMs: 10 * SECOND_MS, tickMs: HOUR_MS},
  '15m': {durationMs: 15 * MINUTE_MS, label: '15 мин', stepMs: SECOND_MS, tickMs: 2 * MINUTE_MS},
  '24h': {durationMs: 24 * HOUR_MS, label: '24 ч', stepMs: MINUTE_MS, tickMs: 3 * HOUR_MS},
};

const ZOOM_OPTIONS = TIMELINE_ZOOMS.map(zoom => ({label: TIMELINE_ZOOM_META[zoom].label, value: zoom}));

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toPercent(time: number, view: TimeRange) {
  return ((time - view.start) / (view.end - view.start)) * 100;
}

/** Шкала рисуется в SVG, поэтому отрезки, отметки и подписи сразу получают положение в процентах её ширины */
export function useTimeline(options: UseTimelineOptions) {
  const {bookmarks, day, events, now, onSeek, position, segments} = options;
  const [zoom, setZoom] = useState<TimelineZoom>('24h');
  const [scrub, setScrub] = useState<ScrubState | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {durationMs, stepMs, tickMs} = TIMELINE_ZOOM_META[zoom];
  const isToday = now >= day.start && now < day.end;
  const recordedUntil = isToday ? now : day.end;
  // Видимая часть дня: окно масштаба с центром в текущем моменте, прижатое к границам дня
  const center = position ?? (isToday ? now : (day.start + day.end) / 2);
  const windowStart = clamp(center - durationMs / 2, day.start, day.end - durationMs);
  const centeredView = durationMs >= day.end - day.start ? day : {end: windowStart + durationMs, start: windowStart};
  const view = scrub?.view ?? centeredView;
  const value = clamp(scrub?.value ?? position ?? view.start, view.start, view.end);
  const hasValue = scrub !== null || position !== null;
  const futureX = toPercent(Math.max(now, view.start), view);

  // Отметки кратны шагу подписей от полуночи; у самого края шкалы подписи обрезались бы
  const ticks: TimelineTick[] = [];
  const firstTick = day.start + Math.ceil((view.start - day.start) / tickMs) * tickMs;
  for (let tick = firstTick; tick <= view.end; tick += tickMs) {
    const percent = toPercent(tick, view);
    if (percent >= TICK_EDGE_PERCENT && percent <= 100 - TICK_EDGE_PERCENT) {
      ticks.push({label: shortClockFormat.format(tick), time: tick, x: `${percent}%`});
    }
  }

  const visibleSegments = (segments ?? []).filter(
    segment => segment.start < Math.min(view.end, recordedUntil) && segment.end > view.start
  );
  const segmentBars = visibleSegments.map(segment => {
    const start = Math.max(segment.start, view.start);
    const end = Math.min(segment.end, recordedUntil, view.end);
    return {
      key: segment.start,
      trigger: segment.trigger,
      width: `${Math.max(toPercent(end, view) - toPercent(start, view), MIN_SEGMENT_PERCENT)}%`,
      x: `${toPercent(start, view)}%`,
    };
  });

  const eventMarks = events.flatMap(event => {
    const time = Date.parse(event.occurredAt);
    if (time < view.start || time > view.end) return [];
    return [{category: event.category, id: event.id, x: `${toPercent(time, view)}%`}];
  });

  // Закладки камеры — за все дни, на шкале только закладки этого дня
  const bookmarkMarks = (bookmarks ?? []).flatMap(bookmark => {
    const time = Date.parse(bookmark.at);
    if (time < view.start || time > view.end || time >= day.end) return [];
    return [{id: bookmark.id, x: `${toPercent(time, view)}%`}];
  });

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) clearTimeout(commitTimerRef.current);
    },
    []
  );

  const changeZoom = useCallback((next: string) => {
    if (isOneOf(TIMELINE_ZOOMS, next)) setZoom(next);
  }, []);

  const changeValue = useCallback(
    (values: number[]) => {
      const [next] = values;
      if (next !== undefined) setScrub(previous => ({value: next, view: previous?.view ?? view}));
    },
    [view]
  );

  const commitValue = useCallback(
    (values: number[]) => {
      const [next] = values;
      if (next === undefined) return;
      if (commitTimerRef.current !== null) clearTimeout(commitTimerRef.current);
      commitTimerRef.current = setTimeout(() => {
        commitTimerRef.current = null;
        setScrub(null);
        onSeek(next);
      }, COMMIT_DELAY_MS);
    },
    [onSeek]
  );

  const trackHover = useCallback(
    (event: PointerEvent<HTMLSpanElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0) return;
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      setHover(view.start + ratio * (view.end - view.start));
    },
    [view.end, view.start]
  );

  const clearHover = useCallback(() => {
    setHover(null);
  }, []);

  return {
    bookmarks: bookmarkMarks,
    changeValue,
    changeZoom,
    clearHover,
    commitValue,
    events: eventMarks,
    future: isToday && now < view.end ? {width: `${100 - futureX}%`, x: `${futureX}%`} : null,
    hasValue,
    hover: hover === null ? null : {label: formatClock(hover), x: `${toPercent(hover, view)}%`},
    max: view.end,
    min: view.start,
    segments: segmentBars,
    step: stepMs,
    ticks,
    trackHover,
    value,
    valueText: hasValue ? formatDateTime(value) : 'момент не выбран',
    zoom,
    zoomOptions: ZOOM_OPTIONS,
  };
}
