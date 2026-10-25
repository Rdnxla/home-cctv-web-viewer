import type {EventCategory, EventPeriod, EventType} from '@/api/events/types';
import {EVENT_TYPES} from '@/api/events/types';

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
  label: string;
}

const DEVICE_SOURCE_LABEL = 'Устройство';

const EVENT_CATEGORY_META: Record<EventCategory, EventCategoryMeta> = {
  alarm: {color: 'red', label: 'Тревога', pluralLabel: 'Тревоги', rank: 3},
  detection: {color: 'blue', label: 'Детекция', pluralLabel: 'Детекции', rank: 1},
  warning: {color: 'amber', label: 'Предупреждение', pluralLabel: 'Предупреждения', rank: 2},
};

const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
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

const EVENT_PERIOD_META: Record<EventPeriod, EventPeriodMeta> = {
  '1h': {label: 'Последний час'},
  '7d': {label: 'Последние 7 дней'},
  '24h': {label: 'Последние 24 часа'},
  '30d': {label: 'Последние 30 дней'},
  all: {label: 'Всё время'},
};

function getEventTypesByCategory(category: EventCategory) {
  return EVENT_TYPES.filter(type => EVENT_TYPE_META[type].category === category);
}

export {DEVICE_SOURCE_LABEL, EVENT_CATEGORY_META, EVENT_PERIOD_META, EVENT_TYPE_META, getEventTypesByCategory};
