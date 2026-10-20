import {Flex, Text} from '@radix-ui/themes';
import {formatEventTime} from '../lib/format';
import {DEVICE_SOURCE_LABEL} from '../model/meta';
import type {NvrEvent} from '../model/types';
import styles from './EventSummary.module.scss';
import {EventTypeLabel} from './EventTypeLabel';

interface EventSummaryProps {
  event: NvrEvent;
  /** Время в формате потребителя (относительное, часы дня и т. п.); полная дата — в подсказке */
  timeLabel: string;
  /** Показать источник (камеру или регистратор) перед описанием */
  withSource?: boolean;
}

/** Краткое описание события: тип, время и текст. Только строчные элементы — можно класть в кнопку */
export function EventSummary(props: EventSummaryProps) {
  const {event, timeLabel, withSource = false} = props;
  const description = withSource ? `${event.cameraName ?? DEVICE_SOURCE_LABEL} · ${event.message}` : event.message;

  return (
    <span className={styles.eventSummary}>
      <Flex
        align='center'
        as='span'
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
          className={styles.eventSummary__time}
          color='gray'
          size='1'
        >
          <time
            dateTime={event.occurredAt}
            title={formatEventTime(event.occurredAt)}
          >
            {timeLabel}
          </time>
        </Text>
      </Flex>
      <Text
        color='gray'
        size='1'
        truncate
      >
        {description}
      </Text>
    </span>
  );
}
