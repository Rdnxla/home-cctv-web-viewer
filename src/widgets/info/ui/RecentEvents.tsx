import {Flex, Heading, Link, Skeleton, Text} from '@radix-ui/themes';
import {useCallback, useId} from 'react';
import {Link as RouterLink} from 'react-router';
import type {EventListParams, EventListResponse} from '@/entities/event';
import {
  DEVICE_SOURCE_LABEL,
  EVENT_CATEGORIES,
  EventCategoryBadge,
  EventTypeLabel,
  formatEventTime,
  useEventsQuery,
} from '@/entities/event';
import {ROUTES} from '@/shared/config/routes';
import {formatRelativeTime} from '@/shared/lib/formatRelativeTime';
import {InlineError} from '@/shared/ui';
import styles from './RecentEvents.module.scss';

/** Последние события за сутки: та же выборка даёт и список, и счётчики по категориям */
const RECENT_EVENTS_PARAMS: EventListParams = {
  categories: [],
  order: 'desc',
  page: 1,
  pageSize: 10,
  period: '24h',
  query: '',
  sort: 'occurredAt',
  source: null,
  types: [],
};

const SKELETON_KEYS = ['event-skeleton-1', 'event-skeleton-2', 'event-skeleton-3', 'event-skeleton-4'];

interface RecentEventsListProps {
  data: EventListResponse;
}

function RecentEventsList(props: RecentEventsListProps) {
  const {data} = props;

  return (
    <>
      <Flex
        gap='3'
        mb='3'
        wrap='wrap'
      >
        {EVENT_CATEGORIES.map(category => (
          <Flex
            align='center'
            gap='1'
            key={category}
          >
            <EventCategoryBadge category={category} />
            <Text
              size='2'
              weight='medium'
            >
              {data.categoryCounts[category]}
            </Text>
          </Flex>
        ))}
      </Flex>

      {data.items.length === 0 ? (
        <Text
          color='gray'
          size='2'
        >
          За сутки событий не было
        </Text>
      ) : (
        <ul className={styles.recentEvents__list}>
          {data.items.map(event => (
            <li
              className={
                event.category === 'alarm'
                  ? `${styles.recentEvents__item} ${styles.recentEvents__alarm}`
                  : styles.recentEvents__item
              }
              key={event.id}
            >
              <Flex
                align='center'
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
                  className={styles.recentEvents__time}
                  color='gray'
                  size='1'
                >
                  <time
                    dateTime={event.occurredAt}
                    title={formatEventTime(event.occurredAt)}
                  >
                    {formatRelativeTime(event.occurredAt)}
                  </time>
                </Text>
              </Flex>
              <Text
                as='p'
                color='gray'
                size='1'
                truncate
              >
                {`${event.cameraName ?? DEVICE_SOURCE_LABEL} · ${event.message}`}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Лента последних событий со ссылкой на полный журнал */
export function RecentEvents() {
  const headingId = useId();
  const {data, isPending, refetch} = useEventsQuery(RECENT_EVENTS_PARAMS);

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  function renderContent() {
    if (data) return <RecentEventsList data={data} />;
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

  return (
    <section aria-labelledby={headingId}>
      <Flex
        align='center'
        gap='2'
        justify='between'
        mb='3'
      >
        <Heading
          as='h4'
          id={headingId}
          size='3'
        >
          События за сутки
        </Heading>
        <Link
          asChild
          size='2'
        >
          <RouterLink to={ROUTES.events}>Весь журнал</RouterLink>
        </Link>
      </Flex>
      {renderContent()}
    </section>
  );
}
