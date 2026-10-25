import {delay, HttpResponse, http} from 'msw';
import type {ApiErrorCodeType} from '@/shared/api/authErrorCodes';
import {ApiErrorCode} from '@/shared/api/authErrorCodes';
import type {CreateBookmarkPayload} from '@/api/bookmarks/types';
import {BOOKMARK_TITLE_MAX_LENGTH} from '@/api/bookmarks/types';
import type {StreamInfo} from '@/api/cameras/types';
import type {RecordingListResponse} from '@/api/recordings/types';
import {addBookmark, listBookmarks, removeBookmark} from '../data/bookmarks';
import {cameras} from '../data/nvr';
import {getCameraRecordings, hasRecordingAt} from '../data/recordings';
import {closeMockWhepSession, createMockWhepSession} from './mockWhep';

const API = '/api';
/** Самый длинный период запроса файлов: сутки с запасом на переход на летнее время */
const MAX_RECORDINGS_RANGE_MS = 48 * 3_600_000;
const MAX_PLAYBACK_SPEED = 16;
const PLAYBACK_TTL_MS = 5 * 60_000;

interface PlaybackQuery {
  from: number;
  speed: number;
}

function errorResponse(status: number, error: ApiErrorCodeType, message: string) {
  return HttpResponse.json({error, message}, {status});
}

function cameraNotFound() {
  return errorResponse(404, ApiErrorCode.cameraNotFound, 'Камера не найдена');
}

function findCamera(id: unknown) {
  return cameras.find(camera => camera.id === id);
}

function parseTime(value: string | null) {
  const time = value === null ? Number.NaN : Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function parsePlaybackQuery(search: URLSearchParams): PlaybackQuery | string {
  const from = parseTime(search.get('from'));
  const speed = Number(search.get('speed') ?? '1');
  if (from === null) return 'from: ожидается дата в формате ISO 8601';
  if (!Number.isFinite(speed) || speed <= 0 || speed > MAX_PLAYBACK_SPEED) {
    return `speed: ожидается число больше 0 и не больше ${MAX_PLAYBACK_SPEED}`;
  }
  return {from, speed};
}

function parseBookmarkPayload(body: unknown): CreateBookmarkPayload | string {
  if (typeof body !== 'object' || body === null) return 'Ожидается JSON-объект';
  const {at, cameraId, title} = body as Record<string, unknown>;
  if (typeof cameraId !== 'string' || findCamera(cameraId) === undefined) return 'cameraId: камера не найдена';
  const time = typeof at === 'string' ? parseTime(at) : null;
  if (time === null || time > Date.now()) return 'at: ожидается прошедший момент в формате ISO 8601';
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (trimmed === '' || trimmed.length > BOOKMARK_TITLE_MAX_LENGTH) {
    return `title: от 1 до ${BOOKMARK_TITLE_MAX_LENGTH} символов`;
  }
  return {at: new Date(time).toISOString(), cameraId, title: trimmed};
}

export const archiveHandlers = [
  http.get(`${API}/cameras/:id/recordings`, async ({params, request}) => {
    await delay(300);
    const camera = findCamera(params.id);
    if (!camera) return cameraNotFound();

    const search = new URL(request.url).searchParams;
    const from = parseTime(search.get('from'));
    const to = parseTime(search.get('to'));
    if (from === null || to === null) {
      return errorResponse(400, ApiErrorCode.validationError, 'from, to: ожидаются даты в формате ISO 8601');
    }
    if (to <= from || to - from > MAX_RECORDINGS_RANGE_MS) {
      return errorResponse(400, ApiErrorCode.validationError, 'to: позже from, но не больше чем на 48 часов');
    }

    const now = Date.now();
    const recordings = getCameraRecordings(camera.id, now);
    const first = recordings.at(0);
    const last = recordings.at(-1);

    return HttpResponse.json<RecordingListResponse>({
      bounds: first && last ? {from: first.startedAt, to: last.endedAt ?? new Date(now).toISOString()} : null,
      items: recordings.filter(
        recording =>
          Date.parse(recording.startedAt) < to &&
          (recording.endedAt === null ? now : Date.parse(recording.endedAt)) > from
      ),
    });
  }),

  http.get(`${API}/cameras/:id/playback`, async ({params, request}) => {
    await delay(250);
    const camera = findCamera(params.id);
    if (!camera) return cameraNotFound();

    const query = parsePlaybackQuery(new URL(request.url).searchParams);
    if (typeof query === 'string') return errorResponse(400, ApiErrorCode.validationError, query);
    if (!hasRecordingAt(camera.id, query.from, Date.now())) {
      return errorResponse(404, ApiErrorCode.recordingNotFound, 'В выбранный момент записи нет');
    }

    const search = new URLSearchParams({from: new Date(query.from).toISOString(), speed: String(query.speed)});
    return HttpResponse.json<StreamInfo>({
      cameraId: camera.id,
      codec: camera.codec,
      expiresAt: new Date(Date.now() + PLAYBACK_TTL_MS).toISOString(),
      fps: camera.fps,
      iceServers: [],
      protocol: 'webrtc',
      resolution: camera.resolution,
      whepUrl: `${API}/playback/${camera.id}/whep?${search.toString()}`,
    });
  }),

  http.post(`${API}/playback/:id/whep`, async ({params, request}) => {
    const camera = findCamera(params.id);
    if (!camera) return cameraNotFound();

    const query = parsePlaybackQuery(new URL(request.url).searchParams);
    if (typeof query === 'string') return errorResponse(400, ApiErrorCode.validationError, query);
    if (request.headers.get('content-type') !== 'application/sdp') {
      return errorResponse(415, ApiErrorCode.invalidBody, 'Ожидается Content-Type: application/sdp');
    }

    const offer = await request.text();
    const {answerSdp, sessionId} = await createMockWhepSession(offer, camera.name, query);

    return new HttpResponse(answerSdp, {
      headers: {
        'Content-Type': 'application/sdp',
        Location: `${API}/playback/${camera.id}/whep/${sessionId}`,
      },
      status: 201,
    });
  }),

  http.delete(`${API}/playback/:id/whep/:session`, ({params}) => {
    closeMockWhepSession(String(params.session));
    return new HttpResponse(null, {status: 200});
  }),

  http.get(`${API}/bookmarks`, async ({request}) => {
    await delay(200);
    return HttpResponse.json(listBookmarks(new URL(request.url).searchParams.get('cameraId')));
  }),

  http.post(`${API}/bookmarks`, async ({request}) => {
    await delay(300);
    const body: unknown = await request.json().catch(() => null);
    const payload = parseBookmarkPayload(body);
    if (typeof payload === 'string') return errorResponse(400, ApiErrorCode.validationError, payload);
    return HttpResponse.json(addBookmark(payload, Date.now()), {status: 201});
  }),

  http.delete(`${API}/bookmarks/:id`, async ({params}) => {
    await delay(200);
    if (!removeBookmark(String(params.id))) {
      return errorResponse(404, ApiErrorCode.bookmarkNotFound, 'Закладка не найдена');
    }
    return new HttpResponse(null, {status: 204});
  }),
];
