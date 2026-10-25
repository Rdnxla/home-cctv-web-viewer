import type {Bookmark, CreateBookmarkPayload} from '@/api/bookmarks/types';
import type {EventType} from '@/api/events/types';
import {events} from './events';
import {hasRecordingAt} from './recordings';

/**
 * Закладки архива для моков. MSW работает внутри страницы, поэтому, чтобы сохранённые закладки
 * переживали перезагрузку в DEV, «сервер» держит их в localStorage; где его нет (node) — только в памяти.
 * Начальные закладки указывают на реальные события журнала, у которых есть запись.
 */

const STORAGE_KEY = 'mock-archive-bookmarks';
const SEED_CREATED_AFTER_MS = 15 * 60_000;
const BOOKMARK_FIELDS = ['at', 'cameraId', 'createdAt', 'id', 'title'];

interface BookmarkSeed {
  cameraId: string;
  title: string;
  type: EventType;
}

const SEEDS: BookmarkSeed[] = [
  {cameraId: 'cam-1', title: 'Курьер у калитки', type: 'person'},
  {cameraId: 'cam-2', title: 'Машина у ворот', type: 'vehicle'},
  {cameraId: 'cam-3', title: 'Проверить: движение на парковке', type: 'motion'},
];

function createSeedBookmarks(now: number): Bookmark[] {
  return SEEDS.flatMap((seed, index) => {
    const event = events.findLast(
      item =>
        item.cameraId === seed.cameraId &&
        item.type === seed.type &&
        hasRecordingAt(seed.cameraId, Date.parse(item.occurredAt), now)
    );
    if (!event) return [];
    const createdAt = Math.min(Date.parse(event.occurredAt) + SEED_CREATED_AFTER_MS, now);
    return [
      {
        at: event.occurredAt,
        cameraId: seed.cameraId,
        createdAt: new Date(createdAt).toISOString(),
        id: `bm-seed-${index + 1}`,
        title: seed.title,
      },
    ];
  });
}

function isBookmark(value: unknown): value is Bookmark {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return BOOKMARK_FIELDS.every(field => typeof record[field] === 'string');
}

function readStoredBookmarks() {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isBookmark) : null;
  } catch {
    return null;
  }
}

function storeBookmarks(list: Bookmark[]) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Хранилища нет (node, запрет в браузере) — закладки живут до перезагрузки
  }
}

let bookmarks: Bookmark[] = readStoredBookmarks() ?? createSeedBookmarks(Date.now());

export function listBookmarks(cameraId: string | null) {
  return bookmarks
    .filter(bookmark => cameraId === null || bookmark.cameraId === cameraId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function addBookmark(payload: CreateBookmarkPayload, now: number) {
  const bookmark: Bookmark = {...payload, createdAt: new Date(now).toISOString(), id: `bm-${crypto.randomUUID()}`};
  bookmarks = [...bookmarks, bookmark];
  storeBookmarks(bookmarks);
  return bookmark;
}

export function removeBookmark(id: string) {
  const next = bookmarks.filter(bookmark => bookmark.id !== id);
  if (next.length === bookmarks.length) return false;
  bookmarks = next;
  storeBookmarks(bookmarks);
  return true;
}
