export {
  bookmarkKeys,
  useBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
} from './api/bookmarkQueries';
export {BOOKMARK_TITLE_MAX_LENGTH} from './model/limits';
export type {Bookmark, CreateBookmarkPayload} from './model/types';
