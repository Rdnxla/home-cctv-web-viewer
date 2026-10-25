const BOOKMARK_TITLE_MAX_LENGTH = 80;

interface Bookmark {
  at: string;
  cameraId: string;
  createdAt: string;
  id: string;
  title: string;
}

interface CreateBookmarkPayload {
  at: string;
  cameraId: string;
  title: string;
}

export type {Bookmark, CreateBookmarkPayload};
export {BOOKMARK_TITLE_MAX_LENGTH};
