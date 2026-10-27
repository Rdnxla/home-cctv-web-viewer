import {MagnifyingGlassIcon} from '@radix-ui/react-icons';
import {Button, Flex, Link, Skeleton, Table, Text} from '@radix-ui/themes';
import {Link as RouterLink} from 'react-router';
import {DEVICE_SOURCE_LABEL, EventCategoryBadge, EventTypeLabel, formatEventTime} from '@/entities/event';
import {ROUTES} from '@/shared/config/routes';
import {SortableHeaderCell} from '@/shared/ui';
import type {EventListParams, EventSortField, NvrEvent} from '@/api/events/types';
import styles from './EventTable.module.scss';

const COLUMN_COUNT = 5;
const MAX_SKELETON_ROWS = 10;

interface ColumnHeaderProps {
  field: EventSortField;
  label: string;
  onSort: (field: EventSortField) => void;
  params: Pick<EventListParams, 'order' | 'sort'>;
}

function ColumnHeader(props: ColumnHeaderProps) {
  const {field, label, onSort, params} = props;

  return (
    <SortableHeaderCell
      direction={params.sort === field ? params.order : null}
      onSort={onSort}
      sortKey={field}
    >
      {label}
    </SortableHeaderCell>
  );
}

interface EventRowProps {
  event: NvrEvent;
}

function EventRow(props: EventRowProps) {
  const {event} = props;

  return (
    <Table.Row
      align='center'
      className={event.category === 'alarm' ? styles.eventTable__alarmRow : undefined}
    >
      <Table.RowHeaderCell className={styles.eventTable__time}>
        <time dateTime={event.occurredAt}>{formatEventTime(event.occurredAt)}</time>
      </Table.RowHeaderCell>
      <Table.Cell>
        <EventCategoryBadge category={event.category} />
      </Table.Cell>
      <Table.Cell className={styles.eventTable__nowrap}>
        <EventTypeLabel type={event.type} />
      </Table.Cell>
      <Table.Cell className={styles.eventTable__nowrap}>
        {event.cameraId === null ? (
          <Text color='gray'>{DEVICE_SOURCE_LABEL}</Text>
        ) : (
          <Link asChild>
            <RouterLink to={ROUTES.cameraDetail(event.cameraId)}>{event.cameraName ?? event.cameraId}</RouterLink>
          </Link>
        )}
      </Table.Cell>
      <Table.Cell>
        <span className={styles.eventTable__message}>{event.message}</span>
      </Table.Cell>
    </Table.Row>
  );
}

interface SkeletonRowsProps {
  count: number;
}

function SkeletonRows(props: SkeletonRowsProps) {
  const {count} = props;
  const rows = Array.from({length: Math.min(count, MAX_SKELETON_ROWS)}, (_, index) => `skeleton-${index}`);

  return rows.map(row => (
    <Table.Row key={row}>
      <Table.RowHeaderCell>
        <Skeleton
          height='16px'
          width='150px'
        />
      </Table.RowHeaderCell>
      <Table.Cell>
        <Skeleton
          height='20px'
          width='90px'
        />
      </Table.Cell>
      <Table.Cell>
        <Skeleton
          height='16px'
          width='140px'
        />
      </Table.Cell>
      <Table.Cell>
        <Skeleton
          height='16px'
          width='110px'
        />
      </Table.Cell>
      <Table.Cell>
        <Skeleton
          height='16px'
          width='100%'
        />
      </Table.Cell>
    </Table.Row>
  ));
}

interface EventTableProps {
  events: NvrEvent[] | undefined;
  hasActiveFilters: boolean;
  isStale: boolean;
  onResetFilters: () => void;
  onSort: (field: EventSortField) => void;
  params: EventListParams;
}

function EventTableBody(props: EventTableProps) {
  const {events, hasActiveFilters, onResetFilters, params} = props;

  if (events === undefined) return <SkeletonRows count={params.pageSize} />;

  if (events.length === 0) {
    return (
      <Table.Row>
        <Table.Cell colSpan={COLUMN_COUNT}>
          <Flex
            align='center'
            className={styles.eventTable__empty}
            direction='column'
            gap='2'
          >
            <Text
              as='span'
              color='gray'
            >
              <MagnifyingGlassIcon
                aria-hidden='true'
                height={28}
                width={28}
              />
            </Text>
            <Text
              size='3'
              weight='medium'
            >
              Событий не найдено
            </Text>
            <Text
              align='center'
              color='gray'
              size='2'
            >
              {hasActiveFilters
                ? 'Под выбранные фильтры за этот период ничего не попало.'
                : 'За выбранный период событий не было.'}
            </Text>
            {hasActiveFilters ? (
              <Button
                mt='2'
                onClick={onResetFilters}
                variant='soft'
              >
                Сбросить фильтры
              </Button>
            ) : null}
          </Flex>
        </Table.Cell>
      </Table.Row>
    );
  }

  return events.map(event => (
    <EventRow
      event={event}
      key={event.id}
    />
  ));
}

export function EventTable(props: EventTableProps) {
  const {isStale, onSort, params} = props;

  return (
    <Table.Root
      aria-busy={isStale}
      className={isStale ? `${styles.eventTable} ${styles.eventTable__stale}` : styles.eventTable}
      size={{initial: '1', sm: '2'}}
      variant='surface'
    >
      <Table.Header className={styles.eventTable__header}>
        <Table.Row>
          <ColumnHeader
            field='occurredAt'
            label='Время'
            onSort={onSort}
            params={params}
          />
          <ColumnHeader
            field='category'
            label='Категория'
            onSort={onSort}
            params={params}
          />
          <ColumnHeader
            field='type'
            label='Событие'
            onSort={onSort}
            params={params}
          />
          <ColumnHeader
            field='source'
            label='Источник'
            onSort={onSort}
            params={params}
          />
          <Table.ColumnHeaderCell>Описание</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <EventTableBody {...props} />
      </Table.Body>
    </Table.Root>
  );
}
