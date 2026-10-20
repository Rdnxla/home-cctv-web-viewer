import {PauseIcon, PlayIcon, TrackNextIcon, TrackPreviousIcon, VideoIcon} from '@radix-ui/react-icons';
import {Button, Flex, IconButton, Select, Text, Tooltip} from '@radix-ui/themes';
import {useCallback} from 'react';
import {Link as RouterLink} from 'react-router';
import type {Camera} from '@/entities/camera';
import {PLAYBACK_SPEEDS} from '@/entities/camera';
import type {NvrEvent} from '@/entities/event';
import {ROUTES} from '@/shared/config/routes';
import {getEventSeekTime} from '../lib/eventSeek';
import {formatSpeed} from '../lib/format';
import {formatClock, SECOND_MS} from '../lib/time';
import type {Playback, PlaybackStatus} from '../model/usePlayback';
import {AddBookmarkButton} from './AddBookmarkButton';
import styles from './PlaybackControls.module.scss';

const STEP_MS = 10 * SECOND_MS;
/** Событие, на котором уже стоим, не считается ни предыдущим, ни следующим */
const EVENT_TOLERANCE_MS = SECOND_MS;

const STATUS_LABELS: Record<PlaybackStatus, string> = {
  connecting: 'Открытие записи…',
  ended: 'Воспроизведение остановлено',
  failed: 'Ошибка воспроизведения',
  idle: 'Момент не выбран',
  loading: 'Загрузка архива…',
  'no-recording': 'Нет записи',
  paused: 'Пауза',
  playing: 'Воспроизведение',
};

interface PlaybackControlsProps {
  camera: Camera;
  /** События дня по возрастанию времени */
  events: NvrEvent[];
  playback: Playback;
}

/** Управление воспроизведением: переходы по событиям, шаг ±10 с, пауза, скорость, закладка и прямой эфир */
export function PlaybackControls(props: PlaybackControlsProps) {
  const {camera, events, playback} = props;
  const {canTogglePlay, position, seek, setSpeed, speed, status, step, togglePlay} = playback;
  const isActive = status === 'playing' || status === 'connecting';
  const previousEvent =
    position === null ? null : events.findLast(event => getEventSeekTime(event) < position - EVENT_TOLERANCE_MS);
  const nextEvent =
    position === null ? null : events.find(event => getEventSeekTime(event) > position + EVENT_TOLERANCE_MS);

  const stepBack = useCallback(() => {
    step(-STEP_MS);
  }, [step]);

  const stepForward = useCallback(() => {
    step(STEP_MS);
  }, [step]);

  const goToPreviousEvent = useCallback(() => {
    if (previousEvent) seek(getEventSeekTime(previousEvent));
  }, [previousEvent, seek]);

  const goToNextEvent = useCallback(() => {
    if (nextEvent) seek(getEventSeekTime(nextEvent));
  }, [nextEvent, seek]);

  const changeSpeed = useCallback(
    (value: string) => {
      const next = PLAYBACK_SPEEDS.find(item => String(item) === value);
      if (next !== undefined) setSpeed(next);
    },
    [setSpeed]
  );

  return (
    <Flex
      align='center'
      gap='3'
      justify='between'
      wrap='wrap'
    >
      <Flex
        align='center'
        gap='2'
      >
        <Tooltip content='Предыдущее событие'>
          <IconButton
            aria-label='Предыдущее событие'
            color='gray'
            disabled={!previousEvent}
            onClick={goToPreviousEvent}
            variant='soft'
          >
            <TrackPreviousIcon />
          </IconButton>
        </Tooltip>
        <Button
          aria-label='Назад на 10 секунд'
          color='gray'
          disabled={position === null}
          onClick={stepBack}
          variant='soft'
        >
          −10 с
        </Button>
        <IconButton
          aria-label={isActive ? 'Пауза' : 'Воспроизвести'}
          disabled={!canTogglePlay}
          onClick={togglePlay}
          size='3'
        >
          {isActive ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <Button
          aria-label='Вперёд на 10 секунд'
          color='gray'
          disabled={position === null}
          onClick={stepForward}
          variant='soft'
        >
          +10 с
        </Button>
        <Tooltip content='Следующее событие'>
          <IconButton
            aria-label='Следующее событие'
            color='gray'
            disabled={!nextEvent}
            onClick={goToNextEvent}
            variant='soft'
          >
            <TrackNextIcon />
          </IconButton>
        </Tooltip>
      </Flex>

      <Flex direction='column'>
        <Text
          className={styles.playbackControls__clock}
          size='5'
          weight='bold'
        >
          {position === null ? '--:--:--' : formatClock(position)}
        </Text>
        <Text
          aria-live='polite'
          color='gray'
          size='1'
        >
          {STATUS_LABELS[status]}
        </Text>
      </Flex>

      <Flex
        align='center'
        gap='2'
        wrap='wrap'
      >
        <Select.Root
          onValueChange={changeSpeed}
          value={String(speed)}
        >
          <Select.Trigger
            aria-label='Скорость воспроизведения'
            color='gray'
            variant='soft'
          />
          <Select.Content position='popper'>
            {PLAYBACK_SPEEDS.map(item => (
              <Select.Item
                key={item}
                value={String(item)}
              >
                {formatSpeed(item)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <AddBookmarkButton
          cameraId={camera.id}
          position={position}
        />
        <Button
          asChild
          color='gray'
          variant='soft'
        >
          <RouterLink to={ROUTES.cameraDetail(camera.id)}>
            <VideoIcon />
            Прямой эфир
          </RouterLink>
        </Button>
      </Flex>
    </Flex>
  );
}
