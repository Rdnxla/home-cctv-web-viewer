import {Flex, SegmentedControl, Text} from '@radix-ui/themes';
import {Slider} from 'radix-ui';
import type {PointerEvent} from 'react';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import type {Bookmark} from '@/entities/bookmark';
import type {EventCategory, NvrEvent} from '@/entities/event';
import type {RecordingTrigger} from '@/entities/recording';
import {RECORDING_TRIGGER_META, RECORDING_TRIGGERS} from '@/entities/recording';
import {isOneOf} from '@/shared/lib/isOneOf';
import type {RecordingSegment} from '../lib/coverage';
import {formatDateTime, formatShortClock} from '../lib/format';
import type {TimeRange} from '../lib/time';
import {formatClock} from '../lib/time';
import type {TimelineZoom} from '../lib/timelineScale';
import {clamp, getTicks, getViewRange, TIMELINE_ZOOM_META, TIMELINE_ZOOMS, toPercent} from '../lib/timelineScale';
import styles from './Timeline.module.scss';

/** Подписи у самого края шкалы обрезались бы */
const TICK_EDGE_PERCENT = 3;
/** Самый короткий отрезок записи всё равно виден (≈2 px на ширине 1000 px) */
const MIN_SEGMENT_PERCENT = 0.2;
/** Стрелки клавиатуры подтверждают каждое нажатие — переходим, когда пользователь остановился */
const COMMIT_DELAY_MS = 300;

const TRIGGER_CLASSES: Record<RecordingTrigger, string | undefined> = {
  continuous: styles.timeline__continuous,
  event: styles.timeline__event,
};

const CATEGORY_CLASSES: Record<EventCategory, string | undefined> = {
  alarm: styles.timeline__alarm,
  detection: styles.timeline__detection,
  warning: styles.timeline__warning,
};

interface ScrubState {
  value: number;
  /** Пока ползунок тянут, шкала не сдвигается под пальцем */
  view: TimeRange;
}

interface LegendItemProps {
  className: string | undefined;
  label: string;
}

function LegendItem(props: LegendItemProps) {
  const {className, label} = props;

  return (
    <Flex align='center' gap='1'>
      <span aria-hidden='true' className={`${styles.timeline__swatch} ${className ?? ''}`} />
      <Text color='gray' size='1'>
        {label}
      </Text>
    </Flex>
  );
}

/** Координата SVG в процентах ширины шкалы */
function percentOf(time: number, view: TimeRange) {
  return `${toPercent(time, view)}%`;
}

function isInView(time: number, view: TimeRange) {
  return time >= view.start && time <= view.end;
}

interface TimelineProps {
  /** Закладки этого дня */
  bookmarks: Bookmark[];
  day: TimeRange;
  /** События этого дня */
  events: NvrEvent[];
  now: number;
  onSeek: (time: number) => void;
  position: number | null;
  /** `undefined` — записи ещё загружаются */
  segments: RecordingSegment[] | undefined;
}

/**
 * Шкала времени дня: отрезки записи, события, закладки и текущая позиция.
 * Щелчок или перетаскивание — переход к моменту, стрелки — шаг по шкале (с Shift — крупнее).
 * Слои нарисованы в SVG: положение задаётся атрибутами в процентах ширины.
 */
export function Timeline(props: TimelineProps) {
  const {bookmarks, day, events, now, onSeek, position, segments} = props;
  const [zoom, setZoom] = useState<TimelineZoom>('24h');
  const [scrub, setScrub] = useState<ScrubState | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelId = useId();
  const hatchId = useId();

  const zoomMeta = TIMELINE_ZOOM_META[zoom];
  const isToday = now >= day.start && now < day.end;
  const recordedUntil = isToday ? now : day.end;
  const center = position ?? (isToday ? now : (day.start + day.end) / 2);
  const view = scrub?.view ?? getViewRange(day, zoomMeta.durationMs, center);
  const value = clamp(scrub?.value ?? position ?? view.start, view.start, view.end);
  const hasValue = scrub !== null || position !== null;
  const futureStart = Math.max(now, view.start);
  const ticks = getTicks(day, view, zoomMeta.tickMs).filter(tick => {
    const percent = toPercent(tick, view);
    return percent >= TICK_EDGE_PERCENT && percent <= 100 - TICK_EDGE_PERCENT;
  });
  const visibleSegments = (segments ?? []).filter(
    segment => segment.start < Math.min(view.end, recordedUntil) && segment.end > view.start
  );

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) clearTimeout(commitTimerRef.current);
    },
    []
  );

  const changeZoom = useCallback((next: string) => {
    if (isOneOf(TIMELINE_ZOOMS, next)) setZoom(next);
  }, []);

  const handleValueChange = useCallback(
    (values: number[]) => {
      const [next] = values;
      if (next !== undefined) setScrub(previous => ({value: next, view: previous?.view ?? view}));
    },
    [view]
  );

  const handleValueCommit = useCallback(
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

  const handlePointerMove = useCallback(
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

  return (
    <Flex direction='column' gap='2'>
      <Flex align='center' gap='3' justify='between' wrap='wrap'>
        <Text color='gray' id={labelId} size='2'>
          Шкала времени
        </Text>
        <SegmentedControl.Root aria-label='Масштаб шкалы времени' onValueChange={changeZoom} size='1' value={zoom}>
          {TIMELINE_ZOOMS.map(item => (
            <SegmentedControl.Item key={item} value={item}>
              {TIMELINE_ZOOM_META[item].label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl.Root>
      </Flex>

      <div>
        <Slider.Root
          className={styles.timeline__slider}
          max={view.end}
          min={view.start}
          onPointerLeave={clearHover}
          onPointerMove={handlePointerMove}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          step={zoomMeta.stepMs}
          value={[value]}
        >
          <Slider.Track className={styles.timeline__track}>
            <svg aria-hidden='true' className={styles.timeline__layers}>
              <defs>
                <pattern height='8' id={hatchId} patternTransform='rotate(45)' patternUnits='userSpaceOnUse' width='8'>
                  <rect className={styles.timeline__hatch} height='8' width='3' />
                </pattern>
              </defs>
              {ticks.map(tick => (
                <line
                  className={styles.timeline__grid}
                  key={tick}
                  x1={percentOf(tick, view)}
                  x2={percentOf(tick, view)}
                  y1='0'
                  y2='100%'
                />
              ))}
              {isToday && now < view.end ? (
                <rect
                  fill={`url(#${hatchId})`}
                  height='100%'
                  width={`${100 - toPercent(futureStart, view)}%`}
                  x={percentOf(futureStart, view)}
                  y='0'
                />
              ) : null}
              {visibleSegments.map(segment => {
                const start = Math.max(segment.start, view.start);
                const end = Math.min(segment.end, recordedUntil, view.end);
                const width = Math.max(toPercent(end, view) - toPercent(start, view), MIN_SEGMENT_PERCENT);
                return (
                  <rect
                    className={TRIGGER_CLASSES[segment.trigger]}
                    height='24'
                    key={segment.start}
                    rx='2'
                    width={`${width}%`}
                    x={percentOf(start, view)}
                    y='24'
                  />
                );
              })}
              {events
                .filter(event => isInView(Date.parse(event.occurredAt), view))
                .map(event => (
                  <rect
                    className={CATEGORY_CLASSES[event.category]}
                    height='14'
                    key={event.id}
                    rx='1'
                    transform='translate(-1 0)'
                    width='2'
                    x={percentOf(Date.parse(event.occurredAt), view)}
                    y='6'
                  />
                ))}
              {bookmarks
                .filter(bookmark => isInView(Date.parse(bookmark.at), view))
                .map(bookmark => (
                  <svg
                    aria-hidden='true'
                    key={bookmark.id}
                    overflow='visible'
                    x={percentOf(Date.parse(bookmark.at), view)}
                    y='0'
                  >
                    <path className={styles.timeline__bookmark} d='M0 2 L5 7 L0 12 L-5 7 Z' />
                  </svg>
                ))}
              {hover === null ? null : (
                <line
                  className={styles.timeline__hoverLine}
                  x1={percentOf(hover, view)}
                  x2={percentOf(hover, view)}
                  y1='0'
                  y2='100%'
                />
              )}
            </svg>
          </Slider.Track>
          <Slider.Thumb
            aria-describedby={labelId}
            aria-label='Момент воспроизведения'
            aria-valuetext={hasValue ? formatDateTime(value) : 'момент не выбран'}
            className={hasValue ? styles.timeline__thumb : `${styles.timeline__thumb} ${styles.timeline__thumbEmpty}`}
          />
        </Slider.Root>

        <svg aria-hidden='true' className={styles.timeline__ticks}>
          {hover === null
            ? ticks.map(tick => (
                <text className={styles.timeline__tick} key={tick} textAnchor='middle' x={percentOf(tick, view)} y='13'>
                  {formatShortClock(tick)}
                </text>
              ))
            : null}
          {hover === null ? null : (
            <text className={styles.timeline__hoverLabel} textAnchor='middle' x={percentOf(hover, view)} y='13'>
              {formatClock(hover)}
            </text>
          )}
        </svg>
      </div>

      <Flex gap='4' wrap='wrap'>
        {RECORDING_TRIGGERS.map(trigger => (
          <LegendItem
            className={TRIGGER_CLASSES[trigger]}
            key={trigger}
            label={RECORDING_TRIGGER_META[trigger].label}
          />
        ))}
        <LegendItem className={styles.timeline__swatchEvents} label='Событие' />
        <LegendItem className={styles.timeline__swatchBookmark} label='Закладка' />
      </Flex>
    </Flex>
  );
}
