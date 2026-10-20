import {Flex, Heading, Link, Skeleton, Text} from '@radix-ui/themes';
import {useCallback, useId} from 'react';
import {Link as RouterLink} from 'react-router';
import type {EventListParams, EventListResponse} from '@/entities/event';
// TODO: убрать запросы из entities
import {EVENT_CATEGORIES, EventCategoryBadge, EventSummary, useEventsQuery} from '@/entities/event';
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
              <EventSummary
                event={event}
                timeLabel={formatRelativeTime(event.occurredAt)}
                withSource={true}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

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
    <section
      aria-labelledby={headingId}
      className={styles.recentEvents}
    >
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
