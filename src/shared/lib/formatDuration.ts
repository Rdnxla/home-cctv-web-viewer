const SECOND_MS = 1000;
const MINUTE_S = 60;
const HOUR_S = 3600;

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / SECOND_MS));
  const hours = Math.floor(totalSeconds / HOUR_S);
  const minutes = Math.floor((totalSeconds % HOUR_S) / MINUTE_S);
  const seconds = totalSeconds % MINUTE_S;

  if (hours > 0) return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  if (minutes > 0) return seconds > 0 ? `${minutes} мин ${seconds} с` : `${minutes} мин`;
  return `${seconds} с`;
}
