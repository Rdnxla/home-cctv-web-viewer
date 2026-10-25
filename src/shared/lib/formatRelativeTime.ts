const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const relativeTimeFormat = new Intl.RelativeTimeFormat('ru', {numeric: 'auto'});
const dateTimeFormat = new Intl.DateTimeFormat('ru', {dateStyle: 'short', timeStyle: 'short'});

export function formatRelativeTime(isoDate: string, now = Date.now()) {
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) return '—';

  const diff = time - now;
  const distance = Math.abs(diff);
  if (distance < MINUTE_MS) return 'только что';
  if (distance < HOUR_MS) return relativeTimeFormat.format(Math.round(diff / MINUTE_MS), 'minute');
  if (distance < DAY_MS) return relativeTimeFormat.format(Math.round(diff / HOUR_MS), 'hour');
  return dateTimeFormat.format(time);
}
