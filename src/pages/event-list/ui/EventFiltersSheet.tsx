import {MixerHorizontalIcon} from '@radix-ui/react-icons';
import {Badge, Button} from '@radix-ui/themes';
import {useCallback, useState} from 'react';
import {formatCount} from '@/shared/lib/pluralize';
import {SideSheet} from '@/shared/ui';
import type {EventCategory, EventListParams} from '@/api/events/types';
import type {EventListFilters} from '../model/eventListParams';
import {countActiveFilters, EVENT_FORMS} from '../model/eventListParams';
import {EventFilters} from './EventFilters';

interface EventFiltersSheetProps {
  categoryCounts: Record<EventCategory, number> | undefined;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<EventListFilters>) => void;
  onPageSizeChange: (pageSize: number) => void;
  onReset: () => void;
  params: EventListParams;
  total: number | null;
}

export function EventFiltersSheet(props: EventFiltersSheetProps) {
  const {categoryCounts, hasActiveFilters, onChange, onPageSizeChange, onReset, params, total} = props;
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(params);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <SideSheet
      description='Изменения применяются сразу'
      footer={
        <Button
          onClick={close}
          size='3'
          variant='solid'
        >
          {total === null ? 'Показать события' : `Показать ${formatCount(total, EVENT_FORMS)}`}
        </Button>
      }
      onOpenChange={setOpen}
      open={open}
      title='Фильтры'
      trigger={
        <Button
          color='gray'
          variant='surface'
        >
          <MixerHorizontalIcon aria-hidden='true' />
          Фильтры
          {activeCount > 0 ? (
            <Badge
              radius='full'
              size='1'
              variant='solid'
            >
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      }
    >
      <EventFilters
        categoryCounts={categoryCounts}
        hasActiveFilters={hasActiveFilters}
        onChange={onChange}
        onPageSizeChange={onPageSizeChange}
        onReset={onReset}
        params={params}
        stacked
      />
    </SideSheet>
  );
}
