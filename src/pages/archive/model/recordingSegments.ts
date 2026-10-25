import type {Recording, RecordingTrigger} from '@/api/recordings/types';
import type {TimeRange} from '../lib/time';
import {SECOND_MS} from '../lib/time';

/** Соседние файлы с разрывом не больше секунды — одна непрерывная запись */
const MERGE_TOLERANCE_MS = SECOND_MS;

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

export interface RecordingSegment extends TimeRange {
  trigger: RecordingTrigger;
}

/**
 * Файл, который ещё пишется, тянется до конца дня: где кончается запись на самом деле,
 * знает только «сейчас», его учитывают при показе и воспроизведении.
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

export function getCoverage(segments: RecordingSegment[]): TimeRange[] {
  return mergeRanges(
    segments.map(({end, start}) => ({end, start})),
    () => true
  );
}
