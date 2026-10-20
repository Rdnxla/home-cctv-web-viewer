import {ChevronLeftIcon, ChevronRightIcon} from '@radix-ui/react-icons';
import {Button, Flex, Heading, IconButton, Select, Text, TextField, Tooltip} from '@radix-ui/themes';
import type {ChangeEvent} from 'react';
import {useCallback} from 'react';
import type {Camera} from '@/entities/camera';
import type {ArchiveBounds} from '@/entities/recording';
import {useNow} from '@/shared/lib/useNow';
import {formatDayTitle} from '../lib/format';
import {parseDayKey, shiftDay, startOfDay, toDayKey} from '../lib/time';

/** «Сегодня» сменится в полночь и без перезагрузки страницы */
const TODAY_REFRESH_MS = 60_000;

interface ArchiveToolbarProps {
  /** Границы архива выбранной камеры; `undefined` — ещё неизвестны */
  bounds: ArchiveBounds | null | undefined;
  cameraId: string | null;
  cameras: Camera[] | undefined;
  dayStart: number;
  onCameraChange: (cameraId: string) => void;
  onDayChange: (dayStart: number) => void;
}

/** Заголовок архива: выбор камеры и дня */
export function ArchiveToolbar(props: ArchiveToolbarProps) {
  const {bounds, cameraId, cameras, dayStart, onCameraChange, onDayChange} = props;
  const today = startOfDay(useNow(TODAY_REFRESH_MS));
  const firstDay = bounds ? startOfDay(Date.parse(bounds.from)) : null;
  const canGoBack = firstDay === null || dayStart > firstDay;
  const canGoForward = dayStart < today;

  const goToPreviousDay = useCallback(() => {
    onDayChange(shiftDay(dayStart, -1));
  }, [dayStart, onDayChange]);

  const goToNextDay = useCallback(() => {
    onDayChange(shiftDay(dayStart, 1));
  }, [dayStart, onDayChange]);

  const goToToday = useCallback(() => {
    onDayChange(today);
  }, [onDayChange, today]);

  const changeDate = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = parseDayKey(event.target.value);
      if (next !== null) onDayChange(Math.min(next, today));
    },
    [onDayChange, today]
  );

  return (
    <Flex
      align='center'
      gap='3'
      justify='between'
      wrap='wrap'
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
          Архив
        </Heading>
        <Text
          color='gray'
          size='2'
        >
          {formatDayTitle(dayStart)}
        </Text>
      </Flex>

      <Flex
        align='center'
        gap='2'
        wrap='wrap'
      >
        <Select.Root
          disabled={cameras === undefined || cameras.length === 0}
          onValueChange={onCameraChange}
          value={cameraId ?? ''}
        >
          <Select.Trigger
            aria-label='Камера'
            placeholder='Камера'
          />
          <Select.Content position='popper'>
            {cameras?.map(camera => (
              <Select.Item
                key={camera.id}
                value={camera.id}
              >
                {camera.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Flex
          align='center'
          gap='1'
        >
          <Tooltip content='Предыдущий день'>
            <IconButton
              aria-label='Предыдущий день'
              color='gray'
              disabled={!canGoBack}
              onClick={goToPreviousDay}
              variant='soft'
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <TextField.Root
            aria-label='День'
            max={toDayKey(today)}
            min={firstDay === null ? undefined : toDayKey(firstDay)}
            onChange={changeDate}
            type='date'
            value={toDayKey(dayStart)}
          />
          <Tooltip content='Следующий день'>
            <IconButton
              aria-label='Следующий день'
              color='gray'
              disabled={!canGoForward}
              onClick={goToNextDay}
              variant='soft'
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Flex>

        <Button
          color='gray'
          disabled={dayStart === today}
          onClick={goToToday}
          variant='soft'
        >
          Сегодня
        </Button>
      </Flex>
    </Flex>
  );
}
