import {Badge, Flex, Skeleton, Text} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import {useCallback} from 'react';
import type {Recording, RecordingListResponse} from '@/entities/recording';
import {RecordingTriggerBadge} from '@/entities/recording';
import {formatDuration} from '@/shared/lib/formatDuration';
import {formatFileSize} from '@/shared/lib/formatFileSize';
import {InlineError} from '@/shared/ui';
import type {TimeRange} from '../lib/time';
import {formatClock} from '../lib/time';
import {ArchiveList, ArchiveListItem} from './ArchiveList';

const SKELETON_KEYS = ['file-skeleton-1', 'file-skeleton-2', 'file-skeleton-3', 'file-skeleton-4'];

interface RecordingFileItemProps {
  day: TimeRange;
  now: number;
  onSeek: (time: number) => void;
  position: number | null;
  recording: Recording;
}

function RecordingFileItem(props: RecordingFileItemProps) {
  const {day, now, onSeek, position, recording} = props;
  const start = Date.parse(recording.startedAt);
  const isWriting = recording.endedAt === null;
  const end = recording.endedAt === null ? now : Date.parse(recording.endedAt);
  const isCurrent = position !== null && start <= position && position < end;

  // Файл, начатый накануне, воспроизводится с полуночи выбранного дня
  const select = useCallback(() => {
    onSeek(Math.max(start, day.start));
  }, [day.start, onSeek, start]);

  return (
    <ArchiveListItem isCurrent={isCurrent} onSelect={select}>
      <Flex align='center' as='span' gap='2' justify='between'>
        <Text size='2' weight='medium'>
          <time dateTime={recording.startedAt}>{formatClock(start)}</time> –{' '}
          {recording.endedAt === null ? 'сейчас' : <time dateTime={recording.endedAt}>{formatClock(end)}</time>}
        </Text>
        {isWriting ? (
          <Badge color='red' variant='soft'>
            Идёт запись
          </Badge>
        ) : (
          <RecordingTriggerBadge trigger={recording.trigger} />
        )}
      </Flex>
      <Text color='gray' size='1'>
        {`${formatDuration(end - start)} · ${formatFileSize(recording.sizeBytes)}`}
      </Text>
    </ArchiveListItem>
  );
}

interface RecordingFileListProps {
  day: TimeRange;
  now: number;
  onSeek: (time: number) => void;
  position: number | null;
  query: UseQueryResult<RecordingListResponse>;
}

/** Файлы записи за день: переход к началу файла */
export function RecordingFileList(props: RecordingFileListProps) {
  const {day, now, onSeek, position, query} = props;
  const {data, isPending, refetch} = query;

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

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
    return <InlineError message='Не удалось загрузить файлы записи' onRetry={retry} />;
  }

  if (data.items.length === 0) {
    return (
      <Text color='gray' size='2'>
        За этот день файлов записи нет
      </Text>
    );
  }

  return (
    <ArchiveList label='Файлы записи за день'>
      {data.items.map(recording => (
        <RecordingFileItem
          day={day}
          key={recording.id}
          now={now}
          onSeek={onSeek}
          position={position}
          recording={recording}
        />
      ))}
    </ArchiveList>
  );
}
