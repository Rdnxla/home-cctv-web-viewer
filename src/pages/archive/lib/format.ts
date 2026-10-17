const dateTimeFormat = new Intl.DateTimeFormat('ru', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  year: 'numeric',
});
const dateFormat = new Intl.DateTimeFormat('ru', {day: '2-digit', month: '2-digit', year: 'numeric'});
const dayTitleFormat = new Intl.DateTimeFormat('ru', {day: 'numeric', month: 'long', weekday: 'long', year: 'numeric'});
const shortClockFormat = new Intl.DateTimeFormat('ru', {hour: '2-digit', minute: '2-digit'});
const speedFormat = new Intl.NumberFormat('ru');

/** `17.10.2026, 14:05:09` */
export function formatDateTime(time: number) {
  return dateTimeFormat.format(time);
}

/** `17.10.2026` */
export function formatDate(time: number) {
  return dateFormat.format(time);
}

/** `суббота, 17 октября 2026 г.` */
export function formatDayTitle(time: number) {
  return dayTitleFormat.format(time);
}

/** `14:05` */
export function formatShortClock(time: number) {
  return shortClockFormat.format(time);
}

/** `×0,5` */
export function formatSpeed(speed: number) {
  return `×${speedFormat.format(speed)}`;
}
