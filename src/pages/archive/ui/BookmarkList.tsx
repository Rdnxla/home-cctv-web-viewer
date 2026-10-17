import {TrashIcon} from '@radix-ui/react-icons';
import {Flex, IconButton, Skeleton, Text, Tooltip} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback} from 'react';
import type {Bookmark} from '@/entities/bookmark';
import {useDeleteBookmarkMutation} from '@/entities/bookmark';
import {useCalloutMessage} from '@/shared/components/callout/CalloutMessage';
import {InlineError} from '@/shared/ui';
import {formatDateTime} from '../lib/format';
import {ArchiveList, ArchiveListItem} from './ArchiveList';

const SKELETON_KEYS = ['bookmark-skeleton-1', 'bookmark-skeleton-2', 'bookmark-skeleton-3'];

interface BookmarkItemProps {
  bookmark: Bookmark;
  isDeleting: boolean;
  onDelete: (bookmark: Bookmark) => void;
  onOpen: (time: number) => void;
}

function BookmarkItem(props: BookmarkItemProps) {
  const {bookmark, isDeleting, onDelete, onOpen} = props;
  const time = Date.parse(bookmark.at);

  const open = useCallback(() => {
    onOpen(time);
  }, [onOpen, time]);

  const remove = useCallback(() => {
    onDelete(bookmark);
  }, [bookmark, onDelete]);

  return (
    <ArchiveListItem
      actions={
        <Tooltip content='Удалить закладку'>
          <IconButton
            aria-label={`Удалить закладку «${bookmark.title}»`}
            color='gray'
            loading={isDeleting}
            onClick={remove}
            size='1'
            variant='ghost'
          >
            <TrashIcon />
          </IconButton>
        </Tooltip>
      }
      onSelect={open}
    >
      <Text size='2' truncate weight='medium'>
        {bookmark.title}
      </Text>
      <Text color='gray' size='1'>
        {formatDateTime(time)}
      </Text>
    </ArchiveListItem>
  );
}

interface BookmarkListProps {
  /** Переход к моменту закладки — в том числе на другой день */
  onOpen: (time: number) => void;
  query: UseQueryResult<Bookmark[]>;
}

/** Закладки камеры за все дни, новые моменты сверху */
export function BookmarkList(props: BookmarkListProps) {
  const {onOpen, query} = props;
  const {data, isPending, refetch} = query;
  const showMessage = useCalloutMessage();
  const deletion = useDeleteBookmarkMutation();
  const {mutate} = deletion;
  const deletingId = deletion.isPending ? deletion.variables : null;

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  const remove = useCallback(
    (bookmark: Bookmark) => {
      mutate(bookmark.id, {
        onError: error => {
          showMessage(`Не удалось удалить закладку: ${error.message}`, 'error');
        },
        onSuccess: () => {
          showMessage(`Закладка «${bookmark.title}» удалена`, 'success');
        },
      });
    },
    [mutate, showMessage]
  );

  if (!data) {
    if (isPending) {
      return (
        <Flex direction='column' gap='2'>
          {SKELETON_KEYS.map(key => (
            <Skeleton height='44px' key={key} width='100%' />
          ))}
        </Flex>
      );
    }
    return <InlineError message='Не удалось загрузить закладки' onRetry={retry} />;
  }

  if (data.length === 0) {
    return (
      <Text color='gray' size='2'>
        Закладок пока нет. Выберите момент записи и нажмите «В закладки».
      </Text>
    );
  }

  return (
    <ArchiveList label='Закладки камеры'>
      {data.map(bookmark => (
        <BookmarkItem
          bookmark={bookmark}
          isDeleting={bookmark.id === deletingId}
          key={bookmark.id}
          onDelete={remove}
          onOpen={onOpen}
        />
      ))}
    </ArchiveList>
  );
}
