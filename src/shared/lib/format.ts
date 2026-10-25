import {formatRelativeTime} from '@/shared/lib/formatRelativeTime';

const EMPTY_VALUE = '—';
const UNSAFE_FILE_NAME_CHARS = /[\\/:*?"<>|\s]+/gu;

const pad = (value: number) => String(value).padStart(2, '0');

export function formatValue(value: string | number | null) {
  return value === null ? EMPTY_VALUE : String(value);
}

export function formatResolution(resolution: string | null) {
  return resolution === null ? EMPTY_VALUE : resolution.replace('x', ' × ');
}

export function formatFps(fps: number | null) {
  return fps === null ? EMPTY_VALUE : `${fps} к/с`;
}

export function formatLastSeen(lastSeen: string | null, now = Date.now()) {
  return lastSeen === null ? 'нет данных' : formatRelativeTime(lastSeen, now);
}

export function formatSnapshotFileName(cameraName: string, date = new Date()) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `${cameraName.replace(UNSAFE_FILE_NAME_CHARS, '_')}_${day}_${time}.png`;
}
