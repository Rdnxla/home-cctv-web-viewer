import {Flex, Skeleton, Text} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback} from 'react';
import type {EventListResponse, NvrEvent} from '@/entities/event';
import {EventTypeLabel} from '@/entities/event';
import {InlineError} from '@/shared/ui';
import {getEventSeekTime} from '../lib/eventSeek';
import {formatClock} from '../lib/time';
import {ArchiveList, ArchiveListItem} from './ArchiveList';

const SKELETON_KEYS = ['event-skeleton-1', 'event-skeleton-2', 'event-skeleton-3', 'event-skeleton-4'];

interface DayEventItemProps {
  event: NvrEvent;
  isCurrent: boolean;
  onSeek: (time: number) => void;
}

function DayEventItem(props: DayEventItemProps) {
  const {event, isCurrent, onSeek} = props;

  const select = useCallback(() => {
    onSeek(getEventSeekTime(event));
  }, [event, onSeek]);

  return (
    <ArchiveListItem
      isCurrent={isCurrent}
      onSelect={select}
    >
      <Flex
        align='center'
        as='span'
        gap='2'
        justify='between'
      >
        <Text
          size='2'
          weight='medium'
        >
          <EventTypeLabel type={event.type} />
        </Text>
        <Text
          color='gray'
          size='1'
        >
          <time dateTime={event.occurredAt}>{formatClock(Date.parse(event.occurredAt))}</time>
        </Text>
      </Flex>
      <Text
        color='gray'
        size='1'
        truncate
      >
        {event.message}
      </Text>
    </ArchiveListItem>
  );
}

interface DayEventListProps {
  onSeek: (time: number) => void;
  position: number | null;
  query: UseQueryResult<EventListResponse>;
}

/** События камеры за день: переход к событию — с небольшим запасом до него */
export function DayEventList(props: DayEventListProps) {
  const {onSeek, position, query} = props;
  const {data, isPending, refetch} = query;

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  if (!data) {
    if (isPending) {
      return (
        <Flex
          direction='column'
          gap='2'
        >
          {SKELETON_KEYS.map(key => (
            <Skeleton
              height='44px'
              key={key}
              width='100%'
            />
          ))}
        </Flex>
      );
    }
    return (
      <InlineError
        message='Не удалось загрузить события'
        onRetry={retry}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <Text
        color='gray'
        size='2'
      >
        За этот день у камеры событий нет
      </Text>
    );
  }

  // Подсвечено последнее событие, до которого дошло воспроизведение
  const currentId =
    position === null ? null : (data.items.findLast(event => getEventSeekTime(event) <= position)?.id ?? null);

  return (
    <Flex
      direction='column'
      gap='2'
    >
      <ArchiveList label='События за день'>
        {data.items.map(event => (
          <DayEventItem
            event={event}
            isCurrent={event.id === currentId}
            key={event.id}
            onSeek={onSeek}
          />
        ))}
      </ArchiveList>
      {data.total > data.items.length ? (
        <Text
          color='gray'
          size='1'
        >
          {`Показаны первые ${data.items.length} из ${data.total}`}
        </Text>
      ) : null}
    </Flex>
  );
}
