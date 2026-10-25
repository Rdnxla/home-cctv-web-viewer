export const BOOKMARK_TITLE_MAX_LENGTH = 80;

export interface Bookmark {
  at: string;
  cameraId: string;
  createdAt: string;
  id: string;
  title: string;
}

export interface CreateBookmarkPayload {
  at: string;
  cameraId: string;
  title: string;
}
