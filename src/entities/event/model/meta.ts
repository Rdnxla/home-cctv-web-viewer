import type {EventCategory, EventPeriod, EventType} from './catalog';
import {EVENT_TYPES} from './catalog';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

interface EventCategoryMeta {
  color: 'amber' | 'blue' | 'red';
  label: string;
  pluralLabel: string;
  /** Важность для сортировки: чем больше, тем важнее */
  rank: number;
}

interface EventTypeMeta {
  category: EventCategory;
  label: string;
}

interface EventPeriodMeta {
  /** `null` — без ограничения по времени */
  durationMs: number | null;
  label: string;
}

/** Подпись источника для событий самого регистратора */
export const DEVICE_SOURCE_LABEL = 'Устройство';

export const EVENT_CATEGORY_META: Record<EventCategory, EventCategoryMeta> = {
  alarm: {color: 'red', label: 'Тревога', pluralLabel: 'Тревоги', rank: 3},
  detection: {color: 'blue', label: 'Детекция', pluralLabel: 'Детекции', rank: 1},
  warning: {color: 'amber', label: 'Предупреждение', pluralLabel: 'Предупреждения', rank: 2},
};

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  disk_error: {category: 'alarm', label: 'Ошибка диска'},
  disk_full: {category: 'warning', label: 'Диск заполняется'},
  intrusion: {category: 'alarm', label: 'Вторжение в зону'},
  line_crossing: {category: 'detection', label: 'Пересечение линии'},
  login_failed: {category: 'warning', label: 'Неудачный вход'},
  motion: {category: 'detection', label: 'Движение'},
  network_unstable: {category: 'warning', label: 'Нестабильная связь'},
  person: {category: 'detection', label: 'Человек'},
  poe_overload: {category: 'warning', label: 'Перегрузка PoE'},
  power_failure: {category: 'alarm', label: 'Отключение питания'},
  tampering: {category: 'alarm', label: 'Саботаж камеры'},
  vehicle: {category: 'detection', label: 'Транспорт'},
  video_loss: {category: 'alarm', label: 'Потеря видеосигнала'},
};

export const EVENT_PERIOD_META: Record<EventPeriod, EventPeriodMeta> = {
  '1h': {durationMs: HOUR_MS, label: 'Последний час'},
  '7d': {durationMs: 7 * DAY_MS, label: 'Последние 7 дней'},
  '24h': {durationMs: DAY_MS, label: 'Последние 24 часа'},
  '30d': {durationMs: 30 * DAY_MS, label: 'Последние 30 дней'},
  all: {durationMs: null, label: 'Всё время'},
};

export function getEventTypesByCategory(category: EventCategory) {
  return EVENT_TYPES.filter(type => EVENT_TYPE_META[type].category === category);
}
