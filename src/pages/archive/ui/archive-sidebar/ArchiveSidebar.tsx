import {TrashIcon} from '@radix-ui/react-icons';
import {Badge, Box, Card, Flex, IconButton, Skeleton, Tabs, Text, Tooltip} from '@radix-ui/themes';
import {EventSummary} from '@/entities/event';
import {RecordingTriggerBadge} from '@/entities/recording';
import {InlineError} from '@/shared/ui';
import styles from './ArchiveSidebar.module.scss';
import type {ArchiveSidebarProps} from './useArchiveSidebar';
import {useArchiveSidebar} from './useArchiveSidebar';

const EVENT_SKELETON_KEYS = ['event-skeleton-1', 'event-skeleton-2', 'event-skeleton-3', 'event-skeleton-4'];
const BOOKMARK_SKELETON_KEYS = ['bookmark-skeleton-1', 'bookmark-skeleton-2', 'bookmark-skeleton-3'];
const FILE_SKELETON_KEYS = ['file-skeleton-1', 'file-skeleton-2', 'file-skeleton-3', 'file-skeleton-4'];
const CURRENT_BUTTON_CLASS = `${styles.archiveSidebar__button} ${styles.archiveSidebar__current}`;

export function ArchiveSidebar(props: ArchiveSidebarProps) {
  const {bookmarks, deleteBookmark, events, files, openBookmark, retryBookmarks, retryEvents, retryFiles, seekToItem} =
    useArchiveSidebar(props);

  return (
    <Card size='1'>
      <Tabs.Root defaultValue='events'>
        <Tabs.List size='1'>
          <Tabs.Trigger value='events'>{events.label}</Tabs.Trigger>
          <Tabs.Trigger value='bookmarks'>{bookmarks.label}</Tabs.Trigger>
          <Tabs.Trigger value='files'>{files.label}</Tabs.Trigger>
        </Tabs.List>
        <Box pt='3'>
          <Tabs.Content value='events'>
            {events.status === 'loading' ? (
              <Flex
                direction='column'
                gap='2'
              >
                {EVENT_SKELETON_KEYS.map(key => (
                  <Skeleton
                    height='44px'
                    key={key}
                    width='100%'
                  />
                ))}
              </Flex>
            ) : null}
            {events.status === 'error' ? (
              <InlineError
                message='Не удалось загрузить события'
                onRetry={retryEvents}
              />
            ) : null}
            {events.status === 'empty' ? (
              <Text
                color='gray'
                size='2'
              >
                За этот день у камеры событий нет
              </Text>
            ) : null}
            {events.status === 'ready' ? (
              <Flex
                direction='column'
                gap='2'
              >
                <ul
                  aria-label='События за день'
                  className={styles.archiveSidebar__list}
                >
                  {events.items.map(item => (
                    <li
                      className={styles.archiveSidebar__item}
                      key={item.event.id}
                    >
                      <button
                        aria-current={item.isCurrent}
                        className={item.isCurrent ? CURRENT_BUTTON_CLASS : styles.archiveSidebar__button}
                        data-time={item.seekTime}
                        onClick={seekToItem}
                        type='button'
                      >
                        <EventSummary
                          event={item.event}
                          timeLabel={item.timeLabel}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
                {events.note === null ? null : (
                  <Text
                    color='gray'
                    size='1'
                  >
                    {events.note}
                  </Text>
                )}
              </Flex>
            ) : null}
          </Tabs.Content>

          <Tabs.Content value='bookmarks'>
            {bookmarks.status === 'loading' ? (
              <Flex
                direction='column'
                gap='2'
              >
                {BOOKMARK_SKELETON_KEYS.map(key => (
                  <Skeleton
                    height='44px'
                    key={key}
                    width='100%'
                  />
                ))}
              </Flex>
            ) : null}
            {bookmarks.status === 'error' ? (
              <InlineError
                message='Не удалось загрузить закладки'
                onRetry={retryBookmarks}
              />
            ) : null}
            {bookmarks.status === 'empty' ? (
              <Text
                color='gray'
                size='2'
              >
                Закладок пока нет. Выберите момент записи и нажмите «В закладки».
              </Text>
            ) : null}
            {bookmarks.status === 'ready' ? (
              <ul
                aria-label='Закладки камеры'
                className={styles.archiveSidebar__list}
              >
                {bookmarks.items.map(item => (
                  <li
                    className={styles.archiveSidebar__item}
                    key={item.id}
                  >
                    <button
                      className={styles.archiveSidebar__button}
                      data-time={item.time}
                      onClick={openBookmark}
                      type='button'
                    >
                      <Text
                        size='2'
                        truncate
                        weight='medium'
                      >
                        {item.title}
                      </Text>
                      <Text
                        color='gray'
                        size='1'
                      >
                        {item.dateLabel}
                      </Text>
                    </button>
                    <Tooltip content='Удалить закладку'>
                      <IconButton
                        aria-label={`Удалить закладку «${item.title}»`}
                        color='red'
                        data-id={item.id}
                        loading={item.isDeleting}
                        onClick={deleteBookmark}
                        size='4'
                        variant='surface'
                      >
                        <TrashIcon />
                      </IconButton>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            ) : null}
          </Tabs.Content>

          <Tabs.Content value='files'>
            {files.status === 'loading' ? (
              <Flex
                direction='column'
                gap='2'
              >
                {FILE_SKELETON_KEYS.map(key => (
                  <Skeleton
                    height='44px'
                    key={key}
                    width='100%'
                  />
                ))}
              </Flex>
            ) : null}
            {files.status === 'error' ? (
              <InlineError
                message='Не удалось загрузить файлы записи'
                onRetry={retryFiles}
              />
            ) : null}
            {files.status === 'empty' ? (
              <Text
                color='gray'
                size='2'
              >
                За этот день файлов записи нет
              </Text>
            ) : null}
            {files.status === 'ready' ? (
              <ul
                aria-label='Файлы записи за день'
                className={styles.archiveSidebar__list}
              >
                {files.items.map(item => (
                  <li
                    className={styles.archiveSidebar__item}
                    key={item.id}
                  >
                    <button
                      aria-current={item.isCurrent}
                      className={item.isCurrent ? CURRENT_BUTTON_CLASS : styles.archiveSidebar__button}
                      data-time={item.seekTime}
                      onClick={seekToItem}
                      type='button'
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
                          <time dateTime={item.startedAt}>{item.startLabel}</time> –{' '}
                          {item.endedAt === null ? 'сейчас' : <time dateTime={item.endedAt}>{item.endLabel}</time>}
                        </Text>
                        {item.endedAt === null ? (
                          <Badge
                            color='red'
                            variant='soft'
                          >
                            Идёт запись
                          </Badge>
                        ) : (
                          <RecordingTriggerBadge trigger={item.trigger} />
                        )}
                      </Flex>
                      <Text
                        color='gray'
                        size='1'
                      >
                        {item.details}
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Card>
  );
}
