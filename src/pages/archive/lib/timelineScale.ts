import type {TimeRange} from './time';
import {HOUR_MS, MINUTE_MS, SECOND_MS} from './time';

interface TimelineZoomMeta {
  durationMs: number;
  label: string;
  /** Шаг ползунка: точность щелчка и стрелок клавиатуры (с Shift — в 10 раз больше) */
  stepMs: number;
  /** Шаг подписей времени под шкалой */
  tickMs: number;
}

/** Масштабы шкалы — сколько времени видно сразу */
export const TIMELINE_ZOOMS = ['24h', '6h', '1h', '15m'] as const;

export type TimelineZoom = (typeof TIMELINE_ZOOMS)[number];

export const TIMELINE_ZOOM_META: Record<TimelineZoom, TimelineZoomMeta> = {
  '1h': {durationMs: HOUR_MS, label: '1 ч', stepMs: SECOND_MS, tickMs: 10 * MINUTE_MS},
  '6h': {durationMs: 6 * HOUR_MS, label: '6 ч', stepMs: 10 * SECOND_MS, tickMs: HOUR_MS},
  '15m': {durationMs: 15 * MINUTE_MS, label: '15 мин', stepMs: SECOND_MS, tickMs: 2 * MINUTE_MS},
  '24h': {durationMs: 24 * HOUR_MS, label: '24 ч', stepMs: MINUTE_MS, tickMs: 3 * HOUR_MS},
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Видимая часть дня: окно длины `durationMs` с центром в `center`, прижатое к границам дня */
export function getViewRange(day: TimeRange, durationMs: number, center: number): TimeRange {
  if (durationMs >= day.end - day.start) return day;
  const start = clamp(center - durationMs / 2, day.start, day.end - durationMs);
  return {end: start + durationMs, start};
}

/** Отметки, кратные `tickMs` от полуночи, внутри видимой части */
export function getTicks(day: TimeRange, view: TimeRange, tickMs: number) {
  const ticks: number[] = [];
  const first = day.start + Math.ceil((view.start - day.start) / tickMs) * tickMs;
  for (let tick = first; tick <= view.end; tick += tickMs) ticks.push(tick);
  return ticks;
}

/** Положение момента на шкале, % ширины */
export function toPercent(time: number, view: TimeRange) {
  return ((time - view.start) / (view.end - view.start)) * 100;
}
