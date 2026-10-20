import {Cross2Icon} from '@radix-ui/react-icons';
import {Box, Button, Flex, ScrollArea, SegmentedControl, Select} from '@radix-ui/themes';
import {useCallback} from 'react';
import {useCamerasQuery} from '@/entities/camera';
import type {EventCategory, EventListParams, EventType} from '@/entities/event';
import {
  DEVICE_SOURCE,
  EVENT_CATEGORIES,
  EVENT_CATEGORY_META,
  EVENT_PERIOD_META,
  EVENT_PERIODS,
  EVENT_TYPE_META,
} from '@/entities/event';
import {isOneOf} from '@/shared/lib/isOneOf';
import {SearchField} from '@/shared/ui';
import type {EventListFilters} from '../model/eventListParams';
import {EventTypeFilter} from './EventTypeFilter';

/** Значение «без фильтра» для SegmentedControl и Select (Radix не допускает пустую строку) */
const ALL = 'all';

const countFormat = new Intl.NumberFormat('ru');

function withCount(label: string, count: number | undefined) {
  return count === undefined ? label : `${label} · ${countFormat.format(count)}`;
}

interface EventFiltersProps {
  /** Счётчики из последнего ответа; `undefined`, пока ответа нет */
  categoryCounts: Record<EventCategory, number> | undefined;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<EventListFilters>) => void;
  onReset: () => void;
  params: EventListParams;
}

export function EventFilters(props: EventFiltersProps) {
  const {categoryCounts, hasActiveFilters, onChange, onReset, params} = props;
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

  return (
    <Flex
      direction='column'
      gap='3'
    >
      <ScrollArea
        scrollbars='horizontal'
        type='hover'
      >
        <Box pb='2'>
          <SegmentedControl.Root
            aria-label='Категория событий'
            onValueChange={changeCategory}
            value={category ?? ALL}
          >
            <SegmentedControl.Item value={ALL}>{withCount('Все', totalCount)}</SegmentedControl.Item>
            {EVENT_CATEGORIES.map(item => (
              <SegmentedControl.Item
                key={item}
                value={item}
              >
                {withCount(EVENT_CATEGORY_META[item].pluralLabel, categoryCounts?.[item])}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Box>
      </ScrollArea>

      <Flex
        align='center'
        gap='2'
        wrap='wrap'
      >
        <Box
          flexBasis='260px'
          flexGrow='1'
        >
          <SearchField
            label='Поиск по журналу событий'
            onChange={changeQuery}
            placeholder='Поиск по описанию, типу или источнику'
            value={params.query}
          />
        </Box>

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

        {hasActiveFilters ? (
          <Button
            color='gray'
            onClick={onReset}
            variant='ghost'
          >
            <Cross2Icon />
            Сбросить
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
