import {useCallback, useEffect, useRef, useState} from 'react';
import {useCameraPlaybackQuery} from '@/api/cameras/cameraQueries';
import type {PlaybackSpeed} from '@/api/cameras/types';
import type {PlayerState} from '@/api/cameras/useWebRtcPlayer';
import type {TimeRange} from '../../lib/time';
import {floorToSecond, SECOND_MS} from '../../lib/time';

const TICK_MS = 250;
/** Ближе к «сейчас» не перематываем: запись отстаёт от прямого эфира */
const LIVE_EDGE_MS = 10 * SECOND_MS;

type StopReason = 'end' | 'live' | 'paused';

interface StartState {
  key: string;
  /** Когда плеер начал показывать сеанс, по часам браузера */
  wall: number;
}

interface StopState {
  key: string;
  position: number;
  reason: StopReason;
}

interface UsePlaybackOptions {
  cameraId: string;
  coverage: TimeRange[] | undefined;
  day: TimeRange;
  onSeek: (time: number) => void;
  target: number | null;
}

interface StatusInput {
  from: number | null;
  isCoverageLoaded: boolean;
  isFailed: boolean;
  isStarted: boolean;
  stopReason: StopReason | null;
  target: number | null;
}

interface PositionInput {
  from: number | null;
  now: number;
  speed: number;
  startedAt: number | null;
  stopPosition: number | null;
  target: number | null;
}

function findRangeAt(ranges: TimeRange[], time: number) {
  return ranges.find(range => range.start <= time && time < range.end);
}

function snapToRecording(ranges: TimeRange[], time: number) {
  for (const range of ranges) {
    if (time < range.start) return range.start;
    if (time < range.end) return time;
  }
  return null;
}

function resolveStatus(input: StatusInput): PlaybackStatus {
  if (input.target === null) return 'idle';
  if (!input.isCoverageLoaded) return 'loading';
  if (input.from === null) return 'no-recording';
  if (input.stopReason !== null) return input.stopReason === 'paused' ? 'paused' : 'ended';
  if (input.isFailed) return 'failed';
  return input.isStarted ? 'playing' : 'connecting';
}

function resolvePosition(input: PositionInput) {
  if (input.from === null) return input.target;
  if (input.stopPosition !== null) return input.stopPosition;
  if (input.startedAt !== null) return input.from + Math.max(0, input.now - input.startedAt) * input.speed;
  return input.from;
}

export type PlaybackStatus =
  | 'connecting'
  | 'ended'
  | 'failed'
  | 'idle'
  | 'loading'
  | 'no-recording'
  | 'paused'
  | 'playing';

/**
 * Воспроизведение архива камеры. Момент из URL — цель перехода: если записи в этот момент нет, сеанс начинается
 * с ближайшей следующей. Каждый переход открывает новый WHEP-сеанс с нужного места; позиция считается
 * от момента, когда плеер начал показ, с учётом скорости. Пауза останавливает кадр, продолжение — новый сеанс
 * с места паузы. В конце записи воспроизведение перескакивает разрыв, после полуночи — переходит на следующий день,
 * а когда записей дальше нет или запись догнала текущее время — останавливается.
 */
export function usePlayback(options: UsePlaybackOptions) {
  const {cameraId, coverage, day, onSeek, target} = options;
  const [speed, setSpeedValue] = useState<PlaybackSpeed>(1);
  // Новый сеанс с того же места (повторный переход, переподключение) — та же цель, другой номер
  const [nonce, setNonce] = useState(0);
  const [start, setStart] = useState<StartState | null>(null);
  const [stop, setStop] = useState<StopState | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const autoSeekKeyRef = useRef<string | null>(null);

  const from = target === null || coverage === undefined ? null : snapToRecording(coverage, target);
  // Состояния ниже привязаны к ключу сеанса и сами теряют силу, когда начинается другой сеанс
  const key = from === null ? null : `${from}:${speed}:${nonce}`;
  const startedAt = start !== null && start.key === key ? start.wall : null;
  const activeStop = stop !== null && stop.key === key ? stop : null;
  const endReason = activeStop === null || activeStop.reason === 'paused' ? null : activeStop.reason;

  const request = from === null || endReason !== null ? null : {from: new Date(from).toISOString(), speed};
  const {data: stream, error: streamError, refetch} = useCameraPlaybackQuery(cameraId, request);
  const isStreamFailed = streamError !== null && stream === undefined;

  const status = resolveStatus({
    from,
    isCoverageLoaded: coverage !== undefined,
    isFailed: isStreamFailed || (key !== null && failedKey === key),
    isStarted: startedAt !== null,
    stopReason: activeStop?.reason ?? null,
    target,
  });
  const position = resolvePosition({
    from,
    now,
    speed,
    startedAt,
    stopPosition: activeStop?.position ?? null,
    target,
  });
  const isPlaying = status === 'playing';

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [isPlaying]);

  const handlePlayerState = useCallback(
    (state: PlayerState) => {
      if (key === null) return;
      if (state === 'playing') {
        const wall = Date.now();
        setNow(wall);
        setStart(previous => (previous?.key === key ? previous : {key, wall}));
      } else if (state === 'failed') {
        setFailedKey(key);
      }
    },
    [key]
  );

  const seek = useCallback(
    (time: number) => {
      const next = floorToSecond(Math.min(time, Date.now() - LIVE_EDGE_MS));
      const nextFrom = coverage === undefined ? null : snapToRecording(coverage, next);
      // URL не изменится или сеанс начнётся с того же места — новый сеанс нужно запросить явно
      if (next === target || (nextFrom !== null && nextFrom === from)) {
        setNonce(value => value + 1);
      }
      onSeek(next);
    },
    [coverage, from, onSeek, target]
  );

  const retryStream = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  const reconnect = useCallback(() => {
    if (position !== null) seek(position);
  }, [position, seek]);

  const step = useCallback(
    (deltaMs: number) => {
      if (position !== null) seek(position + deltaMs);
    },
    [position, seek]
  );

  const togglePlay = useCallback(() => {
    if (status === 'playing' || status === 'connecting') {
      if (key !== null && position !== null) setStop({key, position, reason: 'paused'});
      return;
    }
    if (status === 'failed' && isStreamFailed) {
      retryStream();
      return;
    }
    if ((status === 'paused' || status === 'failed') && position !== null) {
      seek(position);
      return;
    }
    const firstRange = coverage?.[0];
    if (status === 'idle' && firstRange) seek(firstRange.start);
  }, [coverage, isStreamFailed, key, position, retryStream, seek, status]);

  const setSpeed = useCallback(
    (value: PlaybackSpeed) => {
      setSpeedValue(value);
      if (position !== null && (status === 'playing' || status === 'connecting' || status === 'paused')) {
        seek(position);
      }
    },
    [position, seek, status]
  );

  useEffect(() => {
    if (status !== 'playing' || coverage === undefined || from === null || key === null || position === null) return;
    const current = findRangeAt(coverage, from);
    if (!current) return;
    const wallNow = Date.now();
    const end = Math.min(current.end, wallNow);
    if (position < end || autoSeekKeyRef.current === key) return;

    autoSeekKeyRef.current = key;
    const next = coverage.find(range => range.start >= current.end);
    if (next) {
      seek(next.start);
      return;
    }
    // Запись идёт и после полуночи — продолжаем со следующего дня
    if (current.end >= day.end && day.end <= wallNow) {
      seek(day.end);
      return;
    }
    setStop({key, position: end, reason: current.end > wallNow ? 'live' : 'end'});
  }, [coverage, day.end, from, key, position, seek, status]);

  const canTogglePlay =
    status === 'idle'
      ? coverage !== undefined && coverage.length > 0
      : status !== 'loading' && status !== 'no-recording' && status !== 'ended';

  return {
    canTogglePlay,
    endReason,
    handlePlayerState,
    position,
    reconnect,
    retryStream,
    seek,
    sessionKey: key,
    setSpeed,
    speed,
    status,
    step,
    stream,
    streamError,
    togglePlay,
  };
}

export type Playback = ReturnType<typeof usePlayback>;
