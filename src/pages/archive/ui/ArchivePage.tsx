import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CounterClockwiseClockIcon,
  LinkBreak2Icon,
  VideoIcon,
} from '@radix-ui/react-icons';
import {
  AspectRatio,
  Button,
  Flex,
  Heading,
  IconButton,
  Select,
  Skeleton,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import {Link as RouterLink} from 'react-router';
import {ROUTES} from '@/shared/config/routes';
import {LoadError, MediaWithAside} from '@/shared/ui';
import {useArchivePage} from '../model/useArchivePage';
import styles from './ArchivePage.module.scss';
import {ArchiveViewer} from './archive-viewer/ArchiveViewer';

const EMPTY_ICON_SIZE = 32;

export function Component() {
  const {
    camera,
    camerasQuery,
    canGoBack,
    canGoForward,
    changeDay,
    day,
    dayKey,
    dayTitle,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    isToday,
    maxDayKey,
    minDayKey,
    moment,
    openMoment,
    recordingsQuery,
    retryCameras,
    seek,
    selectCamera,
  } = useArchivePage();
  const {data: cameras, error, isPending} = camerasQuery;

  function renderContent() {
    if (camera) {
      if (recordingsQuery.data?.bounds === null) {
        return (
          <Flex
            align='center'
            direction='column'
            gap='2'
            py='8'
          >
            <Text
              as='span'
              color='gray'
            >
              <CounterClockwiseClockIcon
                aria-hidden='true'
                height={EMPTY_ICON_SIZE}
                width={EMPTY_ICON_SIZE}
              />
            </Text>
            <Text
              align='center'
              size='3'
              weight='medium'
            >
              {`В архиве нет записей камеры «${camera.name}»`}
            </Text>
            <Text
              align='center'
              color='gray'
              size='2'
            >
              Записи появятся, когда камера начнёт передавать видео на регистратор.
            </Text>
            <Button
              asChild
              mt='2'
              variant='soft'
            >
              <RouterLink to={ROUTES.cameraDetail(camera.id)}>Открыть камеру</RouterLink>
            </Button>
          </Flex>
        );
      }
      return (
        <ArchiveViewer
          camera={camera}
          day={day}
          key={camera.id}
          moment={moment}
          onOpenMoment={openMoment}
          onSeek={seek}
          recordingsQuery={recordingsQuery}
        />
      );
    }
    if (isPending) {
      return (
        <MediaWithAside
          aside={
            <Skeleton
              height='420px'
              width='100%'
            />
          }
          media={
            <AspectRatio ratio={16 / 9}>
              <Skeleton
                height='100%'
                width='100%'
              />
            </AspectRatio>
          }
        >
          <Skeleton
            height='48px'
            width='100%'
          />
          <Skeleton
            height='110px'
            width='100%'
          />
        </MediaWithAside>
      );
    }
    if (error) {
      return (
        <LoadError
          message={`Не удалось загрузить список камер: ${error.message}`}
          onRetry={retryCameras}
        />
      );
    }
    const hasCameras = cameras.length > 0;
    return (
      <Flex
        align='center'
        direction='column'
        gap='2'
        py='8'
      >
        <Text
          as='span'
          color='gray'
        >
          {hasCameras ? (
            <LinkBreak2Icon
              aria-hidden='true'
              height={EMPTY_ICON_SIZE}
              width={EMPTY_ICON_SIZE}
            />
          ) : (
            <VideoIcon
              aria-hidden='true'
              height={EMPTY_ICON_SIZE}
              width={EMPTY_ICON_SIZE}
            />
          )}
        </Text>
        <Text
          align='center'
          size='3'
          weight='medium'
        >
          {hasCameras ? 'Камера не найдена' : 'Камеры не подключены'}
        </Text>
        <Text
          align='center'
          color='gray'
          size='2'
        >
          {hasCameras
            ? 'На устройстве нет такой камеры. Выберите камеру из списка.'
            : 'Подключите камеру к PoE-порту регистратора — её записи появятся здесь.'}
        </Text>
      </Flex>
    );
  }

  return (
    <section className={`page ${styles.archivePage}`}>
      <title>{camera ? `Архив — ${camera.name}` : 'Архив'}</title>
      <Flex
        direction='column'
        flexGrow='1'
        gap='4'
      >
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
              size='3'
            >
              Архив
            </Heading>
            <Text
              color='gray'
              size='2'
            >
              {dayTitle}
            </Text>
          </Flex>

          <Flex
            align='center'
            gap='2'
            wrap='wrap'
          >
            <Select.Root
              disabled={cameras === undefined || cameras.length === 0}
              onValueChange={selectCamera}
              value={camera?.id ?? ''}
            >
              <Select.Trigger
                aria-label='Камера'
                placeholder='Камера'
              />
              <Select.Content position='popper'>
                {cameras?.map(item => (
                  <Select.Item
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
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
                max={maxDayKey}
                min={minDayKey}
                onChange={changeDay}
                type='date'
                value={dayKey}
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
              disabled={isToday}
              onClick={goToToday}
              variant='soft'
            >
              Сегодня
            </Button>
          </Flex>
        </Flex>
        {renderContent()}
      </Flex>
    </section>
  );
}
