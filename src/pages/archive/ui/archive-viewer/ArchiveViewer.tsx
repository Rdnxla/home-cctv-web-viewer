// biome-ignore-all lint/nursery/noExcessiveLinesPerFile: по решению владельца просмотр архива — один компонент (плеер, управление, закладка, шкала), его разметка не помещается в 300 строк
import {
  BookmarkIcon,
  CounterClockwiseClockIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  ReloadIcon,
  TrackNextIcon,
  TrackPreviousIcon,
  VideoIcon,
} from '@radix-ui/react-icons';
import {
  Badge,
  Button,
  Flex,
  IconButton,
  Popover,
  SegmentedControl,
  Select,
  Spinner,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import {Slider} from 'radix-ui';
import {useId} from 'react';
import {Link as RouterLink} from 'react-router';
import {CameraPlayer} from '@/entities/camera';
import {RECORDING_TRIGGER_META} from '@/entities/recording';
import {ROUTES} from '@/shared/config/routes';
import {LoadError, MediaWithAside} from '@/shared/ui';
import {BOOKMARK_TITLE_MAX_LENGTH} from '@/api/bookmarks/types';
import type {EventCategory} from '@/api/events/types';
import type {RecordingTrigger} from '@/api/recordings/types';
import {RECORDING_TRIGGERS} from '@/api/recordings/types';
import {ArchiveSidebar} from '../archive-sidebar/ArchiveSidebar';
import styles from './ArchiveViewer.module.scss';
import type {ArchiveViewerProps} from './useArchiveViewer';
import {useArchiveViewer} from './useArchiveViewer';

const ICON_SIZE = 32;

const TRIGGER_CLASSES: Record<RecordingTrigger, string | undefined> = {
  continuous: styles.archiveViewer__triggerContinuous,
  event: styles.archiveViewer__triggerEvent,
};

const CATEGORY_CLASSES: Record<EventCategory, string | undefined> = {
  alarm: styles.archiveViewer__categoryAlarm,
  detection: styles.archiveViewer__categoryDetection,
  warning: styles.archiveViewer__categoryWarning,
};

const PLACEHOLDER_ICONS = {
  error: ExclamationTriangleIcon,
  history: CounterClockwiseClockIcon,
  video: VideoIcon,
};

const LEGEND = [
  ...RECORDING_TRIGGERS.map(trigger => ({
    className: TRIGGER_CLASSES[trigger],
    key: trigger,
    label: RECORDING_TRIGGER_META[trigger].label,
  })),
  {className: styles.archiveViewer__swatchEvents, key: 'events', label: 'Событие'},
  {className: styles.archiveViewer__swatchBookmark, key: 'bookmark', label: 'Закладка'},
];

const EMPTY_THUMB_CLASS = `${styles.archiveViewer__thumb} ${styles.archiveViewer__thumbEmpty}`;

/** Каждый сеанс воспроизведения — отдельный экземпляр плеера (`key` = ключ сеанса) со своим WHEP-подключением */
export function ArchiveViewer(props: ArchiveViewerProps) {
  const {camera, day, recordingsQuery} = props;
  const {
    bookmarkForm,
    bookmarksQuery,
    controls,
    eventsQuery,
    loadError,
    now,
    openBookmark,
    playback,
    player,
    retryRecordings,
    summary,
    timeline,
  } = useArchiveViewer(props);
  const bookmarkTitleId = useId();
  const timelineLabelId = useId();
  const hatchId = useId();
  const {placeholder} = player;
  const PlaceholderIcon = placeholder.icon === 'spinner' ? null : PLACEHOLDER_ICONS[placeholder.icon];

  const sidebar = (
    <ArchiveSidebar
      bookmarksQuery={bookmarksQuery}
      day={day}
      eventsQuery={eventsQuery}
      now={now}
      onOpenBookmark={openBookmark}
      onSeek={playback.seek}
      position={playback.position}
      recordingsQuery={recordingsQuery}
    />
  );

  if (loadError !== null) {
    return (
      <MediaWithAside aside={sidebar}>
        <LoadError
          message={loadError}
          onRetry={retryRecordings}
        />
      </MediaWithAside>
    );
  }

  return (
    <MediaWithAside
      aside={sidebar}
      media={
        <CameraPlayer
          badge={
            <Badge
              color='amber'
              size='1'
              variant='solid'
            >
              {player.badge}
            </Badge>
          }
          fallback={
            <>
              {PlaceholderIcon === null ? (
                <Spinner size='3' />
              ) : (
                <Text
                  as='span'
                  color={placeholder.icon === 'error' ? 'red' : 'gray'}
                >
                  <PlaceholderIcon
                    aria-hidden='true'
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                  />
                </Text>
              )}
              {placeholder.title === null ? null : (
                <Text
                  size='3'
                  weight='medium'
                >
                  {placeholder.title}
                </Text>
              )}
              {placeholder.description === null ? null : (
                <Text
                  color='gray'
                  size='2'
                >
                  {placeholder.description}
                </Text>
              )}
              {placeholder.action === 'live' ? (
                <Button
                  asChild
                  size='2'
                  variant='soft'
                >
                  <RouterLink to={ROUTES.cameraDetail(camera.id)}>Смотреть прямой эфир</RouterLink>
                </Button>
              ) : null}
              {placeholder.action === 'retry' ? (
                <Button
                  onClick={playback.retryStream}
                  size='2'
                  variant='soft'
                >
                  <ReloadIcon />
                  Повторить
                </Button>
              ) : null}
            </>
          }
          getSnapshotDate={player.getSnapshotDate}
          key={playback.sessionKey ?? 'idle'}
          onReconnect={playback.reconnect}
          onStateChange={playback.handlePlayerState}
          paused={player.isPaused}
          stream={playback.stream}
          title={camera.name}
        />
      }
    >
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
              disabled={!controls.hasPreviousEvent}
              onClick={controls.goToPreviousEvent}
              variant='soft'
            >
              <TrackPreviousIcon />
            </IconButton>
          </Tooltip>
          <Button
            aria-label='Назад на 10 секунд'
            color='gray'
            disabled={playback.position === null}
            onClick={controls.stepBack}
            variant='soft'
          >
            −10 с
          </Button>
          <IconButton
            aria-label={controls.isActive ? 'Пауза' : 'Воспроизвести'}
            disabled={!playback.canTogglePlay}
            onClick={playback.togglePlay}
            size='3'
          >
            {controls.isActive ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <Button
            aria-label='Вперёд на 10 секунд'
            color='gray'
            disabled={playback.position === null}
            onClick={controls.stepForward}
            variant='soft'
          >
            +10 с
          </Button>
          <Tooltip content='Следующее событие'>
            <IconButton
              aria-label='Следующее событие'
              color='gray'
              disabled={!controls.hasNextEvent}
              onClick={controls.goToNextEvent}
              variant='soft'
            >
              <TrackNextIcon />
            </IconButton>
          </Tooltip>
        </Flex>

        <Flex direction='column'>
          <Text
            className={styles.archiveViewer__clock}
            size='5'
            weight='bold'
          >
            {controls.clock}
          </Text>
          <Text
            aria-live='polite'
            color='gray'
            size='1'
          >
            {controls.statusLabel}
          </Text>
        </Flex>

        <Flex
          align='center'
          gap='2'
          wrap='wrap'
        >
          <Select.Root
            onValueChange={controls.changeSpeed}
            value={controls.speed}
          >
            <Select.Trigger
              aria-label='Скорость воспроизведения'
              color='gray'
              variant='soft'
            />
            <Select.Content position='popper'>
              {controls.speedOptions.map(option => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Popover.Root
            onOpenChange={bookmarkForm.changeOpen}
            open={bookmarkForm.isOpen}
          >
            <Popover.Trigger>
              <Button
                color='gray'
                disabled={playback.position === null}
                variant='soft'
              >
                <BookmarkIcon />В закладки
              </Button>
            </Popover.Trigger>
            <Popover.Content
              maxWidth='320px'
              width='320px'
            >
              {bookmarkForm.momentLabel === null ? null : (
                <form onSubmit={bookmarkForm.submit}>
                  <Flex
                    direction='column'
                    gap='3'
                  >
                    <Flex
                      direction='column'
                      gap='1'
                    >
                      <Text
                        size='3'
                        weight='medium'
                      >
                        Новая закладка
                      </Text>
                      <Text
                        color='gray'
                        size='2'
                      >
                        {bookmarkForm.momentLabel}
                      </Text>
                    </Flex>
                    <Flex
                      direction='column'
                      gap='1'
                    >
                      <Text
                        as='label'
                        htmlFor={bookmarkTitleId}
                        size='2'
                      >
                        Название
                      </Text>
                      <TextField.Root
                        id={bookmarkTitleId}
                        maxLength={BOOKMARK_TITLE_MAX_LENGTH}
                        onChange={bookmarkForm.changeTitle}
                        placeholder={bookmarkForm.defaultTitle}
                        value={bookmarkForm.title}
                      />
                    </Flex>
                    {bookmarkForm.errorMessage === null ? null : (
                      <Text
                        color='red'
                        size='2'
                      >
                        {bookmarkForm.errorMessage}
                      </Text>
                    )}
                    <Flex
                      gap='2'
                      justify='end'
                    >
                      <Popover.Close>
                        <Button
                          color='gray'
                          type='button'
                          variant='soft'
                        >
                          Отмена
                        </Button>
                      </Popover.Close>
                      <Button
                        loading={bookmarkForm.isPending}
                        type='submit'
                      >
                        Сохранить
                      </Button>
                    </Flex>
                  </Flex>
                </form>
              )}
            </Popover.Content>
          </Popover.Root>
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

      <Flex
        direction='column'
        gap='2'
      >
        <Flex
          align='center'
          gap='3'
          justify='between'
          wrap='wrap'
        >
          <Text
            color='gray'
            id={timelineLabelId}
            size='2'
          >
            Шкала времени
          </Text>
          <SegmentedControl.Root
            aria-label='Масштаб шкалы времени'
            onValueChange={timeline.changeZoom}
            size='1'
            value={timeline.zoom}
          >
            {timeline.zoomOptions.map(option => (
              <SegmentedControl.Item
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Flex>

        <div>
          <Slider.Root
            className={styles.archiveViewer__slider}
            max={timeline.max}
            min={timeline.min}
            onPointerLeave={timeline.clearHover}
            onPointerMove={timeline.trackHover}
            onValueChange={timeline.changeValue}
            onValueCommit={timeline.commitValue}
            step={timeline.step}
            value={[timeline.value]}
          >
            <Slider.Track className={styles.archiveViewer__track}>
              <svg
                aria-hidden='true'
                className={styles.archiveViewer__layers}
              >
                <defs>
                  <pattern
                    height='8'
                    id={hatchId}
                    patternTransform='rotate(45)'
                    patternUnits='userSpaceOnUse'
                    width='8'
                  >
                    <rect
                      className={styles.archiveViewer__hatch}
                      height='8'
                      width='3'
                    />
                  </pattern>
                </defs>
                {timeline.ticks.map(tick => (
                  <line
                    className={styles.archiveViewer__grid}
                    key={tick.time}
                    x1={tick.x}
                    x2={tick.x}
                    y1='0'
                    y2='100%'
                  />
                ))}
                {timeline.future === null ? null : (
                  <rect
                    fill={`url(#${hatchId})`}
                    height='100%'
                    width={timeline.future.width}
                    x={timeline.future.x}
                    y='0'
                  />
                )}
                {timeline.segments.map(segment => (
                  <rect
                    className={TRIGGER_CLASSES[segment.trigger]}
                    height='24'
                    key={segment.key}
                    rx='2'
                    width={segment.width}
                    x={segment.x}
                    y='24'
                  />
                ))}
                {timeline.events.map(mark => (
                  <rect
                    className={CATEGORY_CLASSES[mark.category]}
                    height='14'
                    key={mark.id}
                    rx='1'
                    transform='translate(-1 0)'
                    width='2'
                    x={mark.x}
                    y='6'
                  />
                ))}
                {timeline.bookmarks.map(mark => (
                  <svg
                    aria-hidden='true'
                    key={mark.id}
                    overflow='visible'
                    x={mark.x}
                    y='0'
                  >
                    <path
                      className={styles.archiveViewer__bookmark}
                      d='M0 2 L5 7 L0 12 L-5 7 Z'
                    />
                  </svg>
                ))}
                {timeline.hover === null ? null : (
                  <line
                    className={styles.archiveViewer__hoverLine}
                    x1={timeline.hover.x}
                    x2={timeline.hover.x}
                    y1='0'
                    y2='100%'
                  />
                )}
              </svg>
            </Slider.Track>
            <Slider.Thumb
              aria-describedby={timelineLabelId}
              aria-label='Момент воспроизведения'
              aria-valuetext={timeline.valueText}
              className={timeline.hasValue ? styles.archiveViewer__thumb : EMPTY_THUMB_CLASS}
            />
          </Slider.Root>

          <svg
            aria-hidden='true'
            className={styles.archiveViewer__ticks}
          >
            {timeline.hover === null ? (
              timeline.ticks.map(tick => (
                <text
                  className={styles.archiveViewer__tick}
                  key={tick.time}
                  textAnchor='middle'
                  x={tick.x}
                  y='13'
                >
                  {tick.label}
                </text>
              ))
            ) : (
              <text
                className={styles.archiveViewer__hoverLabel}
                textAnchor='middle'
                x={timeline.hover.x}
                y='13'
              >
                {timeline.hover.label}
              </text>
            )}
          </svg>
        </div>

        <Flex
          gap='4'
          wrap='wrap'
        >
          {LEGEND.map(item => (
            <Flex
              align='center'
              gap='1'
              key={item.key}
            >
              <span
                aria-hidden='true'
                className={`${styles.archiveViewer__swatch} ${item.className ?? ''}`}
              />
              <Text
                color='gray'
                size='1'
              >
                {item.label}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      {summary === null ? null : (
        <Text
          color='gray'
          size='2'
        >
          {summary}
        </Text>
      )}
    </MediaWithAside>
  );
}
