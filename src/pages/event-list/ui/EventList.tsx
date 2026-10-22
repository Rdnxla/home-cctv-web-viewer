import {ReloadIcon} from '@radix-ui/react-icons';
import {Flex, Heading, IconButton, Spinner, Text, Tooltip} from '@radix-ui/themes';
import {useCallback, useEffect} from 'react';
import {useEventsQuery} from '@/entities/event';
import {useCalloutMessage} from '@/shared/ui/callout/CalloutMessage';
import {formatCount} from '@/shared/lib/pluralize';
import {LoadError} from '@/shared/ui';
import {hasActiveFilters} from '../model/eventListParams';
import {useEventListParams} from '../model/useEventListParams';
import {EventFilters} from './EventFilters';
import styles from './EventList.module.scss';
import {EventListFooter} from './EventListFooter';
import {EventTable} from './EventTable';

const EVENT_FORMS = {few: 'события', many: 'событий', one: 'событие'};

/** Журнал событий регистратора: тревоги, предупреждения и детекции с фильтрами, сортировкой и пагинацией */
export function Component() {
  const {params, replacePage, resetFilters, setFilters, setPage, setPageSize, toggleSort} = useEventListParams();
  const {data, error, isError, isFetching, isPlaceholderData, isRefetchError, refetch} = useEventsQuery(params);
  const showMessage = useCalloutMessage();
  const isFiltered = hasActiveFilters(params);

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
        gap='4'
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
              size='6'
            >
              Журнал событий
            </Heading>
            {data ? (
              <Text
                color='gray'
                size='2'
              >
                {formatCount(data.total, EVENT_FORMS)}
              </Text>
            ) : null}
          </Flex>
          <Tooltip content='Обновить'>
            <IconButton
              aria-label='Обновить журнал'
              color='gray'
              disabled={isFetching}
              onClick={retry}
              variant='soft'
            >
              {isFetching ? <Spinner /> : <ReloadIcon />}
            </IconButton>
          </Tooltip>
        </Flex>

        <EventFilters
          categoryCounts={data?.categoryCounts}
          hasActiveFilters={isFiltered}
          onChange={setFilters}
          onReset={resetFilters}
          params={params}
        />

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
                onPageSizeChange={setPageSize}
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
