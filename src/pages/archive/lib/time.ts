const DAY_KEY_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;
const DATE_TIME_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})$/u;

const pad = (value: number) => String(value).padStart(2, '0');

/** Метка времени по компонентам местной даты; `null`, если такой даты нет (31 февраля, пропущенный при переводе часов час) */
function fromLocalParts(parts: Record<string, string>) {
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hours = Number(parts.hours ?? '0');
  const minutes = Number(parts.minutes ?? '0');
  const seconds = Number(parts.seconds ?? '0');
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  const isExact =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes &&
    date.getSeconds() === seconds;
  return isExact ? date.getTime() : null;
}

function parseLocal(pattern: RegExp, value: string | null) {
  const groups = value === null ? undefined : pattern.exec(value)?.groups;
  return groups ? fromLocalParts(groups) : null;
}

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;

/** Отрезок времени `[start, end)`, мс */
export interface TimeRange {
  end: number;
  start: number;
}

/** Полночь по местному времени */
export function startOfDay(time: number) {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Начало дня через `days` дней; длина дня при переводе часов учитывается */
export function shiftDay(dayStart: number, days: number) {
  const date = new Date(dayStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
}

export function getDayRange(dayStart: number): TimeRange {
  return {end: shiftDay(dayStart, 1), start: dayStart};
}

export function floorToSecond(time: number) {
  return Math.floor(time / SECOND_MS) * SECOND_MS;
}

/** `2026-10-17` — день по местному времени */
export function toDayKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Начало дня из `2026-10-17` или `null` */
export function parseDayKey(value: string | null) {
  return parseLocal(DAY_KEY_PATTERN, value);
}

/** `14:05:09` по местному времени */
export function formatClock(time: number) {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** `2026-10-17T14:05:09` — момент в URL: местное время без часового пояса, читается человеком */
export function formatLocalDateTime(time: number) {
  return `${toDayKey(time)}T${formatClock(time)}`;
}

export function parseLocalDateTime(value: string | null) {
  return parseLocal(DATE_TIME_PATTERN, value);
}
