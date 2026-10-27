import {Cross2Icon} from '@radix-ui/react-icons';
import {Box, Button, Flex, Select} from '@radix-ui/themes';
import {useCallback} from 'react';
import {EVENT_CATEGORY_META, EVENT_PERIOD_META, EVENT_TYPE_META} from '@/entities/event';
import {isOneOf} from '@/shared/lib/isOneOf';
import {SearchField} from '@/shared/ui';
import {useCamerasQuery} from '@/api/cameras/cameraQueries';
import type {EventCategory, EventListParams, EventType} from '@/api/events/types';
import {DEVICE_SOURCE, EVENT_CATEGORIES, EVENT_PERIODS} from '@/api/events/types';
import type {EventListFilters} from '../model/eventListParams';
import {PAGE_SIZE_OPTIONS} from '../model/eventListParams';
import {EventTypeFilter} from './EventTypeFilter';

const ALL = 'all';
const INLINE_LAYOUT = {align: 'center', direction: 'row', gap: '2', wrap: 'wrap'} as const;
const STACKED_LAYOUT = {align: 'stretch', direction: 'column', gap: '3', wrap: 'nowrap'} as const;

const countFormat = new Intl.NumberFormat('ru');

function withCount(label: string, count: number | undefined) {
  return count === undefined ? label : `${label} · ${countFormat.format(count)}`;
}

interface EventFiltersProps {
  categoryCounts: Record<EventCategory, number> | undefined;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<EventListFilters>) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReset: () => void;
  params: EventListParams;
  stacked?: boolean;
}

export function EventFilters(props: EventFiltersProps) {
  const {categoryCounts, hasActiveFilters, onChange, onPageSizeChange, onReset, params, stacked = false} = props;
  const {data: cameras} = useCamerasQuery();
  const category = params.categories[0] ?? null;
  const totalCount = categoryCounts ? EVENT_CATEGORIES.reduce((sum, item) => sum + categoryCounts[item], 0) : undefined;

  const changeCategory = useCallback(
    (value: string) => {
      if (!isOneOf(EVENT_CATEGORIES, value)) {
        onChange({categories: []});
        return;
      }
      // Типы из других категорий при смене категории теряют смысл
      onChange({categories: [value], types: params.types.filter(type => EVENT_TYPE_META[type].category === value)});
    },
    [onChange, params.types]
  );

  const changeQuery = useCallback(
    (query: string) => {
      onChange({query});
    },
    [onChange]
  );

  const changeTypes = useCallback(
    (types: EventType[]) => {
      onChange({types});
    },
    [onChange]
  );

  const changeSource = useCallback(
    (value: string) => {
      onChange({source: value === ALL ? null : value});
    },
    [onChange]
  );

  const changePeriod = useCallback(
    (value: string) => {
      if (isOneOf(EVENT_PERIODS, value)) onChange({period: value});
    },
    [onChange]
  );

  const changePageSize = useCallback(
    (value: string) => {
      onPageSizeChange(Number(value));
    },
    [onPageSizeChange]
  );

  return (
    <Flex {...(stacked ? STACKED_LAYOUT : INLINE_LAYOUT)}>
      <Box
        flexBasis={stacked ? 'auto' : '260px'}
        flexGrow='1'
      >
        <SearchField
          label='Поиск по журналу событий'
          onChange={changeQuery}
          placeholder='Поиск по описанию, типу или источнику'
          value={params.query}
        />
      </Box>

      <Select.Root
        onValueChange={changeCategory}
        value={category ?? ALL}
      >
        <Select.Trigger aria-label='Категория событий' />
        <Select.Content position='popper'>
          <Select.Item value={ALL}>{withCount('Все категории', totalCount)}</Select.Item>
          {EVENT_CATEGORIES.map(item => (
            <Select.Item
              key={item}
              value={item}
            >
              {withCount(EVENT_CATEGORY_META[item].pluralLabel, categoryCounts?.[item])}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <EventTypeFilter
        category={category}
        onChange={changeTypes}
        value={params.types}
      />

      <Select.Root
        onValueChange={changeSource}
        value={params.source ?? ALL}
      >
        <Select.Trigger aria-label='Источник' />
        <Select.Content position='popper'>
          <Select.Item value={ALL}>Все источники</Select.Item>
          <Select.Item value={DEVICE_SOURCE}>Устройство (NVR)</Select.Item>
          {cameras && cameras.length > 0 ? (
            <>
              <Select.Separator />
              <Select.Group>
                <Select.Label>Камеры</Select.Label>
                {cameras.map(camera => (
                  <Select.Item
                    key={camera.id}
                    value={camera.id}
                  >
                    {camera.name}
                  </Select.Item>
                ))}
              </Select.Group>
            </>
          ) : null}
        </Select.Content>
      </Select.Root>

      <Select.Root
        onValueChange={changePeriod}
        value={params.period}
      >
        <Select.Trigger aria-label='Период' />
        <Select.Content position='popper'>
          {EVENT_PERIODS.map(period => (
            <Select.Item
              key={period}
              value={period}
            >
              {EVENT_PERIOD_META[period].label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        onValueChange={changePageSize}
        value={String(params.pageSize)}
      >
        <Select.Trigger aria-label='Событий на странице' />
        <Select.Content position='popper'>
          {PAGE_SIZE_OPTIONS.map(option => (
            <Select.Item
              key={option}
              value={String(option)}
            >
              {option} на странице
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      {hasActiveFilters ? (
        <Button
          color='gray'
          onClick={onReset}
          variant={stacked ? 'soft' : 'ghost'}
        >
          <Cross2Icon />
          Сбросить
        </Button>
      ) : null}
    </Flex>
  );
}
