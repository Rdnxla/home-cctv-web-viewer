import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {retryUnlessClientError} from '@/shared/api/retry';
import {createBookmark, deleteBookmark, getBookmarks} from './bookmarkApi';

const BOOKMARKS_KEY = 'bookmarks';

const bookmarkKeys = {
  all: [BOOKMARKS_KEY] as const,
  list: (cameraId: string) => [BOOKMARKS_KEY, 'list', cameraId] as const,
};

function useBookmarksQuery(cameraId: string) {
  return useQuery({
    queryFn: () => getBookmarks(cameraId),
    queryKey: bookmarkKeys.list(cameraId),
    retry: retryUnlessClientError,
  });
}

function useCreateBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookmark,
    onSuccess: () => queryClient.invalidateQueries({queryKey: bookmarkKeys.all}),
  });
}

function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => queryClient.invalidateQueries({queryKey: bookmarkKeys.all}),
  });
}

export {bookmarkKeys, useBookmarksQuery, useCreateBookmarkMutation, useDeleteBookmarkMutation};
