import type {UseQueryResult} from '@tanstack/react-query';
import type {MouseEvent} from 'react';
import {useCallback} from 'react';
import type {Bookmark} from '@/entities/bookmark';
import {useDeleteBookmarkMutation} from '@/entities/bookmark';
import type {EventListResponse} from '@/entities/event';
import type {RecordingListResponse} from '@/entities/recording';
import {formatDuration} from '@/shared/lib/formatDuration';
import {formatFileSize} from '@/shared/lib/formatFileSize';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import type {TimeRange} from '../../lib/time';
import {formatClock, formatDateTime, getEventSeekTime} from '../../lib/time';

/** Что показывает вкладка: заглушки на время загрузки, ошибку, пустой список или сам список */
type ListStatus = 'empty' | 'error' | 'loading' | 'ready';

const countFormat = new Intl.NumberFormat('ru');

function getListStatus(isPending: boolean, count: number | undefined): ListStatus {
  if (count === undefined) return isPending ? 'loading' : 'error';
  return count === 0 ? 'empty' : 'ready';
}

function withCount(label: string, count: number | undefined) {
  return count === undefined ? label : `${label} · ${countFormat.format(count)}`;
}

export interface ArchiveSidebarProps {
  bookmarksQuery: UseQueryResult<Bookmark[]>;
  day: TimeRange;
  eventsQuery: UseQueryResult<EventListResponse>;
  now: number;
  /** Переход к моменту закладки — в том числе на другой день */
  onOpenBookmark: (time: number) => void;
  onSeek: (time: number) => void;
  position: number | null;
  recordingsQuery: UseQueryResult<RecordingListResponse>;
}

/**
 * Списки боковой панели архива: события дня, закладки камеры за все дни (новые моменты сверху) и файлы записи.
 * Кнопка пункта хранит момент перехода в `data-time`, кнопка удаления закладки — её id в `data-id`,
 * поэтому на каждый список хватает одного обработчика.
 */
export function useArchiveSidebar(props: ArchiveSidebarProps) {
  const {bookmarksQuery, day, eventsQuery, now, onOpenBookmark, onSeek, position, recordingsQuery} = props;
  const {data: events, isPending: isEventsPending, refetch: refetchEvents} = eventsQuery;
  const {data: bookmarks, isPending: isBookmarksPending, refetch: refetchBookmarks} = bookmarksQuery;
  const {data: recordings, isPending: isRecordingsPending, refetch: refetchRecordings} = recordingsQuery;
  const showMessage = useCalloutMessage();
  const deletion = useDeleteBookmarkMutation();
  const {mutate: deleteBookmarkById} = deletion;
  const deletingId = deletion.isPending ? deletion.variables : null;

  // Подсвечено последнее событие, до которого дошло воспроизведение
  const currentEventId =
    position === null ? null : (events?.items.findLast(event => getEventSeekTime(event) <= position)?.id ?? null);
  const eventsNote =
    events && events.total > events.items.length ? `Показаны первые ${events.items.length} из ${events.total}` : null;

  const eventItems = (events?.items ?? []).map(event => ({
    event,
    isCurrent: event.id === currentEventId,
    seekTime: getEventSeekTime(event),
    timeLabel: formatClock(Date.parse(event.occurredAt)),
  }));

  const bookmarkItems = (bookmarks ?? []).map(bookmark => ({
    dateLabel: formatDateTime(Date.parse(bookmark.at)),
    id: bookmark.id,
    isDeleting: bookmark.id === deletingId,
    time: Date.parse(bookmark.at),
    title: bookmark.title,
  }));

  const fileItems = (recordings?.items ?? []).map(recording => {
    const start = Date.parse(recording.startedAt);
    const end = recording.endedAt === null ? now : Date.parse(recording.endedAt);
    return {
      details: `${formatDuration(end - start)} · ${formatFileSize(recording.sizeBytes)}`,
      endedAt: recording.endedAt,
      endLabel: formatClock(end),
      id: recording.id,
      isCurrent: position !== null && start <= position && position < end,
      // Файл, начатый накануне, воспроизводится с полуночи выбранного дня
      seekTime: Math.max(start, day.start),
      startedAt: recording.startedAt,
      startLabel: formatClock(start),
      trigger: recording.trigger,
    };
  });

  const retryEvents = useCallback(() => {
    refetchEvents().catch(() => ({}));
  }, [refetchEvents]);

  const retryBookmarks = useCallback(() => {
    refetchBookmarks().catch(() => ({}));
  }, [refetchBookmarks]);

  const retryFiles = useCallback(() => {
    refetchRecordings().catch(() => ({}));
  }, [refetchRecordings]);

  const seekToItem = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onSeek(Number(event.currentTarget.dataset.time));
    },
    [onSeek]
  );

  const openBookmark = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onOpenBookmark(Number(event.currentTarget.dataset.time));
    },
    [onOpenBookmark]
  );

  const deleteBookmark = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const {id} = event.currentTarget.dataset;
      const bookmark = bookmarks?.find(item => item.id === id);
      if (!bookmark) return;
      deleteBookmarkById(bookmark.id, {
        onError: error => {
          showMessage(`Не удалось удалить закладку: ${error.message}`, 'error');
        },
        onSuccess: () => {
          showMessage(`Закладка «${bookmark.title}» удалена`, 'success');
        },
      });
    },
    [bookmarks, deleteBookmarkById, showMessage]
  );

  return {
    bookmarks: {
      items: bookmarkItems,
      label: withCount('Закладки', bookmarks?.length),
      status: getListStatus(isBookmarksPending, bookmarks?.length),
    },
    deleteBookmark,
    events: {
      items: eventItems,
      label: withCount('События', events?.total),
      note: eventsNote,
      status: getListStatus(isEventsPending, events?.items.length),
    },
    files: {
      items: fileItems,
      label: withCount('Файлы', recordings?.items.length),
      status: getListStatus(isRecordingsPending, recordings?.items.length),
    },
    openBookmark,
    retryBookmarks,
    retryEvents,
    retryFiles,
    seekToItem,
  };
}
