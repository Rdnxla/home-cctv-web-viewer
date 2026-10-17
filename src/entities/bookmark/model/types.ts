/** Закладка архива: подписанный момент записи камеры */
export interface Bookmark {
  /** Момент записи, ISO 8601 */
  at: string;
  cameraId: string;
  /** ISO 8601 */
  createdAt: string;
  id: string;
  title: string;
}

export interface CreateBookmarkPayload {
  at: string;
  cameraId: string;
  title: string;
}
