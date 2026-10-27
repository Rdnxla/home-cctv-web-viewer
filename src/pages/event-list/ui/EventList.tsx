import {Flex, Heading, Text} from '@radix-ui/themes';
import {useCallback, useEffect} from 'react';
import {useMediaQuery} from '@/shared/lib/useMediaQuery';
import {LoadError} from '@/shared/ui';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import {useEventsQuery} from '@/api/events/eventQueries';
import {hasActiveFilters} from '../model/eventListParams';
import {useEventListParams} from '../model/useEventListParams';
import {EventFilters} from './EventFilters';
import {EventFiltersSheet} from './EventFiltersSheet';
import styles from './EventList.module.scss';
import {EventListFooter} from './EventListFooter';
import {EventTable} from './EventTable';

const countFormat = new Intl.NumberFormat('ru');

function formatRange(page: number, pageSize: number, total: number) {
  if (total === 0) return 'Нет событий';
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return `${countFormat.format(first)}–${countFormat.format(last)} из ${countFormat.format(total)}`;
}

export function Component() {
  const {params, replacePage, resetFilters, setFilters, setPage, setPageSize, toggleSort} = useEventListParams();
  const {data, error, isError, isPlaceholderData, isRefetchError, refetch} = useEventsQuery(params);
  const showMessage = useCalloutMessage();
  const isFiltered = hasActiveFilters(params);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const retry = useCallback(() => {
    refetch().catch(() => ({}));
  }, [refetch]);

  // Фоновое обновление не удалось, но прежние данные на экране — достаточно уведомления
  useEffect(() => {
    if (isRefetchError) showMessage('Не удалось обновить журнал событий', 'error');
  }, [isRefetchError, showMessage]);

  // Номер страницы из URL может оказаться за пределами выборки — переходим на последнюю
  useEffect(() => {
    if (!data || isPlaceholderData || data.items.length > 0 || data.total === 0) return;
    replacePage(Math.ceil(data.total / data.pageSize));
  }, [data, isPlaceholderData, replacePage]);

  return (
    <section className={styles.eventList}>
      <title>Журнал событий</title>
      <Flex
        direction='column'
        flexGrow='1'
        gap={{initial: '3', sm: '4'}}
        minHeight='0'
      >
        <Flex
          align='center'
          gap='3'
          justify='between'
        >
          <Flex
            align='baseline'
            gap='3'
            wrap='wrap'
          >
            <Heading
              as='h2'
              size='3'
            >
              Журнал событий
            </Heading>
            {data ? (
              <Text
                aria-live='polite'
                color='gray'
                size='2'
              >
                {formatRange(params.page, params.pageSize, data.total)}
              </Text>
            ) : null}
          </Flex>
          {isMobile ? (
            <EventFiltersSheet
              categoryCounts={data?.categoryCounts}
              hasActiveFilters={isFiltered}
              onChange={setFilters}
              onPageSizeChange={setPageSize}
              onReset={resetFilters}
              params={params}
              total={data && !isPlaceholderData ? data.total : null}
            />
          ) : null}
        </Flex>

        {isMobile ? null : (
          <EventFilters
            categoryCounts={data?.categoryCounts}
            hasActiveFilters={isFiltered}
            onChange={setFilters}
            onPageSizeChange={setPageSize}
            onReset={resetFilters}
            params={params}
          />
        )}

        {isError && !data ? (
          <LoadError
            message={`Не удалось загрузить журнал событий: ${error.message}`}
            onRetry={retry}
          />
        ) : (
          <>
            <EventTable
              events={data?.items}
              hasActiveFilters={isFiltered}
              isStale={isPlaceholderData}
              onResetFilters={resetFilters}
              onSort={toggleSort}
              params={params}
            />
            {data && data.total > 0 ? (
              <EventListFooter
                disabled={isPlaceholderData}
                onPageChange={setPage}
                page={params.page}
                pageSize={params.pageSize}
                total={data.total}
              />
            ) : null}
          </>
        )}
      </Flex>
    </section>
  );
}
