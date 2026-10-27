import {Badge, Button, DropdownMenu, Flex} from '@radix-ui/themes';
import {Fragment, useCallback} from 'react';
import {EVENT_CATEGORY_META, EventTypeLabel, getEventTypesByCategory} from '@/entities/event';
import type {EventCategory, EventType} from '@/api/events/types';
import {EVENT_CATEGORIES, EVENT_TYPES} from '@/api/events/types';
import styles from './EventTypeFilter.module.scss';

function keepMenuOpen(event: Event) {
  event.preventDefault();
}

interface TypeOptionProps {
  checked: boolean;
  onToggle: (type: EventType, checked: boolean) => void;
  type: EventType;
}

function TypeOption(props: TypeOptionProps) {
  const {checked, onToggle, type} = props;

  const toggle = useCallback(
    (next: boolean) => {
      onToggle(type, next);
    },
    [onToggle, type]
  );

  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onCheckedChange={toggle}
      onSelect={keepMenuOpen}
    >
      <EventTypeLabel type={type} />
    </DropdownMenu.CheckboxItem>
  );
}

interface EventTypeFilterProps {
  category: EventCategory | null;
  onChange: (types: EventType[]) => void;
  value: EventType[];
}

export function EventTypeFilter(props: EventTypeFilterProps) {
  const {category, onChange, value} = props;
  const categories = category === null ? EVENT_CATEGORIES : [category];

  const toggle = useCallback(
    (type: EventType, checked: boolean) => {
      const selected = new Set(value);
      if (checked) {
        selected.add(type);
      } else {
        selected.delete(type);
      }
      onChange(EVENT_TYPES.filter(item => selected.has(item)));
    },
    [onChange, value]
  );

  const clear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          className={styles.eventTypeFilter__trigger}
          color='gray'
          variant='surface'
        >
          Тип события
          <Flex
            align='center'
            as='span'
            gap='2'
          >
            {value.length > 0 ? (
              <Badge
                radius='full'
                size='1'
                variant='solid'
              >
                {value.length}
              </Badge>
            ) : null}
            <DropdownMenu.TriggerIcon />
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {categories.map((item, index) => (
          <Fragment key={item}>
            {index > 0 ? <DropdownMenu.Separator /> : null}
            <DropdownMenu.Group>
              <DropdownMenu.Label>{EVENT_CATEGORY_META[item].pluralLabel}</DropdownMenu.Label>
              {getEventTypesByCategory(item).map(type => (
                <TypeOption
                  checked={value.includes(type)}
                  key={type}
                  onToggle={toggle}
                  type={type}
                />
              ))}
            </DropdownMenu.Group>
          </Fragment>
        ))}
        {value.length > 0 ? (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={clear}>Сбросить выбор типов</DropdownMenu.Item>
          </>
        ) : null}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
