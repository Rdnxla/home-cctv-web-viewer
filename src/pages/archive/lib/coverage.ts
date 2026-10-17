import type {Recording, RecordingTrigger} from '@/entities/recording';
import type {TimeRange} from './time';

/** Соседние файлы с разрывом не больше секунды — одна непрерывная запись */
const MERGE_TOLERANCE_MS = 1000;

function mergeRanges<T extends TimeRange>(ranges: T[], canMerge: (last: T, next: T) => boolean) {
  const merged: T[] = [];
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && range.start - last.end <= MERGE_TOLERANCE_MS && canMerge(last, range)) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({...range});
    }
  }
  return merged;
}

/** Непрерывный отрезок записи одного режима */
export interface RecordingSegment extends TimeRange {
  trigger: RecordingTrigger;
}

/**
 * Файлы → отрезки записи в пределах дня. Файл, который ещё пишется, тянется до конца дня:
 * где кончается запись на самом деле, знает только «сейчас», его учитывают при показе и воспроизведении.
 */
export function getRecordingSegments(recordings: Recording[], day: TimeRange): RecordingSegment[] {
  const clipped = recordings
    .map(recording => ({
      end: Math.min(recording.endedAt === null ? day.end : Date.parse(recording.endedAt), day.end),
      start: Math.max(Date.parse(recording.startedAt), day.start),
      trigger: recording.trigger,
    }))
    .filter(segment => segment.end > segment.start);
  return mergeRanges(clipped, (last, next) => last.trigger === next.trigger);
}

/** Где запись есть, без учёта режима: по этим отрезкам идёт воспроизведение */
export function getCoverage(segments: RecordingSegment[]): TimeRange[] {
  return mergeRanges(
    segments.map(({end, start}) => ({end, start})),
    () => true
  );
}

export function findRangeAt(ranges: TimeRange[], time: number) {
  return ranges.find(range => range.start <= time && time < range.end);
}

/** С чего начать воспроизведение: сам `time`, если в этот момент есть запись, иначе начало следующей; `null` — дальше записей нет */
export function snapToRecording(ranges: TimeRange[], time: number) {
  for (const range of ranges) {
    if (time < range.start) return range.start;
    if (time < range.end) return time;
  }
  return null;
}
