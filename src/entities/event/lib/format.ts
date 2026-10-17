const dateTimeFormat = new Intl.DateTimeFormat('ru', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  year: 'numeric',
});

/** `17.10.2026, 14:05:09` в часовом поясе браузера */
export function formatEventTime(occurredAt: string) {
  const time = Date.parse(occurredAt);
  return Number.isNaN(time) ? occurredAt : dateTimeFormat.format(time);
}
