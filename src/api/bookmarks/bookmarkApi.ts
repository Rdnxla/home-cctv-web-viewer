import {apiFetch} from '@/shared/api/http';
import type {Bookmark, CreateBookmarkPayload} from './types';

const BOOKMARKS_URL = '/api/bookmarks';

function getBookmarks(cameraId: string) {
  const search = new URLSearchParams({cameraId});
  return apiFetch<Bookmark[]>(`${BOOKMARKS_URL}?${search.toString()}`);
}

function createBookmark(payload: CreateBookmarkPayload) {
  return apiFetch<Bookmark>(BOOKMARKS_URL, {
    body: JSON.stringify(payload),
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
  });
}

function deleteBookmark(id: string) {
  return apiFetch<unknown>(`${BOOKMARKS_URL}/${encodeURIComponent(id)}`, {method: 'DELETE'});
}

export {createBookmark, deleteBookmark, getBookmarks};
