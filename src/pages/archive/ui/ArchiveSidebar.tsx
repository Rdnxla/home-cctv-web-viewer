import {Box, Card, Tabs} from '@radix-ui/themes';
import type {UseQueryResult} from '@tanstack/react-query';
import type {Bookmark} from '@/entities/bookmark';
import type {EventListResponse} from '@/entities/event';
import type {RecordingListResponse} from '@/entities/recording';
import type {TimeRange} from '../lib/time';
import {BookmarkList} from './BookmarkList';
import {DayEventList} from './DayEventList';
import {RecordingFileList} from './RecordingFileList';

const countFormat = new Intl.NumberFormat('ru');

function withCount(label: string, count: number | undefined) {
  return count === undefined ? label : `${label} · ${countFormat.format(count)}`;
}

interface ArchiveSidebarProps {
  bookmarksQuery: UseQueryResult<Bookmark[]>;
  day: TimeRange;
  eventsQuery: UseQueryResult<EventListResponse>;
  now: number;
  onOpenBookmark: (time: number) => void;
  onSeek: (time: number) => void;
  position: number | null;
  recordingsQuery: UseQueryResult<RecordingListResponse>;
}

/** Боковая панель архива: события дня, закладки камеры и файлы записи */
export function ArchiveSidebar(props: ArchiveSidebarProps) {
  const {bookmarksQuery, day, eventsQuery, now, onOpenBookmark, onSeek, position, recordingsQuery} = props;

  return (
    <Card size='1'>
      <Tabs.Root defaultValue='events'>
        <Tabs.List size='1'>
          <Tabs.Trigger value='events'>{withCount('События', eventsQuery.data?.total)}</Tabs.Trigger>
          <Tabs.Trigger value='bookmarks'>{withCount('Закладки', bookmarksQuery.data?.length)}</Tabs.Trigger>
          <Tabs.Trigger value='files'>{withCount('Файлы', recordingsQuery.data?.items.length)}</Tabs.Trigger>
        </Tabs.List>
        <Box pt='3'>
          <Tabs.Content value='events'>
            <DayEventList
              onSeek={onSeek}
              position={position}
              query={eventsQuery}
            />
          </Tabs.Content>
          <Tabs.Content value='bookmarks'>
            <BookmarkList
              onOpen={onOpenBookmark}
              query={bookmarksQuery}
            />
          </Tabs.Content>
          <Tabs.Content value='files'>
            <RecordingFileList
              day={day}
              now={now}
              onSeek={onSeek}
              position={position}
              query={recordingsQuery}
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Card>
  );
}
