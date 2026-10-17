import type {NvrEvent} from '@/entities/event';
import {SECOND_MS} from './time';

/** Событие показываем с запасом, чтобы было видно, что ему предшествовало */
const EVENT_PREROLL_MS = 5 * SECOND_MS;

/** С какого момента воспроизводить событие */
export function getEventSeekTime(event: NvrEvent) {
  return Date.parse(event.occurredAt) - EVENT_PREROLL_MS;
}
