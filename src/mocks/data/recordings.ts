import type {Camera} from '@/api/cameras/types';
import type {NvrEvent} from '@/api/events/types';
import type {Recording, RecordingTrigger} from '@/api/recordings/types';
import {events} from './events';
import {cameras} from './nvr';

/**
 * Архив записей для моков, согласованный с журналом событий (`data/events.ts`) и фикстурой камер:
 * `cam-1` и `cam-3` пишут постоянно с разрывами там, где в журнале нестабильная связь или ошибка диска;
 * `cam-2` пишет только вокруг своих событий; `cam-3` перестала писать в момент `lastSeen`; `cam-4` не подключалась.
 * Камера в сети пишет прямо сейчас: её последний файл не закрыт (`endedAt: null`) и растёт с каждым запросом.
 * Файлы режутся по границам часа.
 */

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const ARCHIVE_DAYS = 14;
const PRE_EVENT_MS = 10 * SECOND_MS;
const POST_EVENT_MS = 50 * SECOND_MS;
/** Нестабильная связь: столько камера не писала перед событием */
const NETWORK_GAP_MS = 4 * MINUTE_MS;
/** Ошибка диска: столько не писали все камеры после события */
const DISK_ERROR_GAP_MS = 2 * MINUTE_MS;
const BYTES_PER_KILOBIT = 125;

interface Interval {
  end: number;
  start: number;
}

interface ArchivePlan {
  bitrateKbps: number;
  trigger: RecordingTrigger;
}

interface CameraArchive {
  coverage: Interval[];
  plan: ArchivePlan;
}

const ARCHIVE_PLANS: Record<string, ArchivePlan> = {
  'cam-1': {bitrateKbps: 4096, trigger: 'continuous'},
  'cam-2': {bitrateKbps: 3072, trigger: 'event'},
  'cam-3': {bitrateKbps: 4096, trigger: 'continuous'},
};

const loadedAt = Date.now();
const archiveStart = loadedAt - ARCHIVE_DAYS * DAY_MS;

function getEventTimes(predicate: (event: NvrEvent) => boolean) {
  return events.filter(predicate).map(event => Date.parse(event.occurredAt));
}

function mergeIntervals(intervals: Interval[]) {
  const merged: Interval[] = [];
  for (const interval of [...intervals].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({...interval});
    }
  }
  return merged;
}

function subtractIntervals(base: Interval, gaps: Interval[]) {
  const result: Interval[] = [];
  let cursor = base.start;
  for (const gap of mergeIntervals(gaps)) {
    if (gap.end > cursor && gap.start < base.end) {
      if (gap.start > cursor) result.push({end: gap.start, start: cursor});
      cursor = Math.max(cursor, gap.end);
    }
  }
  if (cursor < base.end) result.push({end: base.end, start: cursor});
  return result;
}

const diskErrorGaps = getEventTimes(event => event.type === 'disk_error').map(time => ({
  end: time + DISK_ERROR_GAP_MS,
  start: time,
}));

function planCoverage(camera: Camera, plan: ArchivePlan): Interval[] {
  if (plan.trigger === 'event') {
    const clips = getEventTimes(event => event.cameraId === camera.id)
      .filter(time => time - PRE_EVENT_MS >= archiveStart)
      .map(time => ({end: Math.min(time + POST_EVENT_MS, loadedAt), start: time - PRE_EVENT_MS}));
    return mergeIntervals(clips);
  }

  if (camera.status !== 'online' && camera.lastSeen === null) return [];
  // Камера в сети пишет до сих пор, камера с ошибкой — до последнего выхода на связь
  const end = camera.status === 'online' ? Number.POSITIVE_INFINITY : Date.parse(camera.lastSeen ?? '');
  const networkGaps = getEventTimes(event => event.cameraId === camera.id && event.type === 'network_unstable').map(
    time => ({end: time, start: time - NETWORK_GAP_MS})
  );
  return subtractIntervals({end, start: archiveStart}, [...networkGaps, ...diskErrorGaps]);
}

const archives = new Map<string, CameraArchive>();
for (const camera of cameras) {
  const plan = ARCHIVE_PLANS[camera.id];
  if (plan) archives.set(camera.id, {coverage: planCoverage(camera, plan), plan});
}

function splitIntoFiles(cameraId: string, plan: ArchivePlan, interval: Interval, now: number) {
  const files: Recording[] = [];
  const end = Math.min(interval.end, now);
  let {start} = interval;
  while (start < end) {
    const fileEnd = Math.min((Math.floor(start / HOUR_MS) + 1) * HOUR_MS, end);
    const isWriting = fileEnd === end && interval.end > now;
    files.push({
      cameraId,
      endedAt: isWriting ? null : new Date(fileEnd).toISOString(),
      id: `rec-${cameraId}-${start}`,
      sizeBytes: Math.round(((fileEnd - start) / SECOND_MS) * plan.bitrateKbps * BYTES_PER_KILOBIT),
      startedAt: new Date(start).toISOString(),
      trigger: plan.trigger,
    });
    start = fileEnd;
  }
  return files;
}

export function getCameraRecordings(cameraId: string, now: number): Recording[] {
  const archive = archives.get(cameraId);
  if (!archive) return [];
  return archive.coverage.flatMap(interval => splitIntoFiles(cameraId, archive.plan, interval, now));
}

export function hasRecordingAt(cameraId: string, time: number, now: number) {
  const archive = archives.get(cameraId);
  return (
    archive !== undefined &&
    time < now &&
    archive.coverage.some(interval => interval.start <= time && time < interval.end)
  );
}
