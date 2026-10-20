import {CounterClockwiseClockIcon, ExclamationTriangleIcon, ReloadIcon, VideoIcon} from '@radix-ui/react-icons';
import {Badge, Button, Spinner, Text} from '@radix-ui/themes';
import {useCallback} from 'react';
import {Link as RouterLink} from 'react-router';
import type {Camera} from '@/entities/camera';
import {CameraPlayer} from '@/entities/camera';
import {ROUTES} from '@/shared/config/routes';
import {formatSpeed} from '../lib/format';
import {formatClock} from '../lib/time';
import type {Playback} from '../model/usePlayback';

const ICON_SIZE = 32;

interface ArchivePlayerProps {
  camera: Camera;
  playback: Playback;
}

/** Что показывает плеер архива, пока видео нет */
function PlaybackPlaceholder(props: ArchivePlayerProps) {
  const {camera, playback} = props;
  const {endReason, position, retryStream, status, streamError} = playback;

  if (status === 'idle') {
    return (
      <>
        <Text
          as='span'
          color='gray'
        >
          <CounterClockwiseClockIcon
            aria-hidden='true'
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Выберите момент
        </Text>
        <Text
          color='gray'
          size='2'
        >
          Нажмите на шкалу времени, событие или файл записи
        </Text>
      </>
    );
  }

  if (status === 'loading') {
    return (
      <>
        <Spinner size='3' />
        <Text
          color='gray'
          size='2'
        >
          Загрузка архива…
        </Text>
      </>
    );
  }

  if (status === 'no-recording') {
    return (
      <>
        <Text
          as='span'
          color='gray'
        >
          <CounterClockwiseClockIcon
            aria-hidden='true'
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Записи нет
        </Text>
        <Text
          color='gray'
          size='2'
        >
          После выбранного момента в этот день камера ничего не записала
        </Text>
      </>
    );
  }

  if (endReason === 'live') {
    return (
      <>
        <Text
          as='span'
          color='gray'
        >
          <VideoIcon
            aria-hidden='true'
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Запись догнала текущее время
        </Text>
        <Button
          asChild
          size='2'
          variant='soft'
        >
          <RouterLink to={ROUTES.cameraDetail(camera.id)}>Смотреть прямой эфир</RouterLink>
        </Button>
      </>
    );
  }

  if (endReason === 'end') {
    return (
      <>
        <Text
          as='span'
          color='gray'
        >
          <CounterClockwiseClockIcon
            aria-hidden='true'
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Записи закончились
        </Text>
        <Text
          color='gray'
          size='2'
        >
          {position === null ? 'Дальше в архиве записей нет' : `После ${formatClock(position)} в архиве записей нет`}
        </Text>
      </>
    );
  }

  if (streamError) {
    return (
      <>
        <Text
          as='span'
          color='red'
        >
          <ExclamationTriangleIcon
            aria-hidden='true'
            height={ICON_SIZE}
            width={ICON_SIZE}
          />
        </Text>
        <Text
          size='3'
          weight='medium'
        >
          Не удалось открыть запись
        </Text>
        <Text
          color='gray'
          size='2'
        >
          {streamError.message}
        </Text>
        <Button
          onClick={retryStream}
          size='2'
          variant='soft'
        >
          <ReloadIcon />
          Повторить
        </Button>
      </>
    );
  }

  return (
    <>
      <Spinner size='3' />
      <Text
        color='gray'
        size='2'
      >
        Открытие записи…
      </Text>
    </>
  );
}

/** Плеер записи: каждый сеанс воспроизведения — отдельный экземпляр плеера со своим WHEP-подключением */
export function ArchivePlayer(props: ArchivePlayerProps) {
  const {camera, playback} = props;
  const {handlePlayerState, position, reconnect, sessionKey, speed, status, stream} = playback;
  const isPaused = status === 'paused';

  const getSnapshotDate = useCallback(() => new Date(position ?? Date.now()), [position]);

  return (
    <CameraPlayer
      badge={
        <Badge
          color='amber'
          size='1'
          variant='solid'
        >
          {isPaused ? 'АРХИВ · ПАУЗА' : `АРХИВ · ${formatSpeed(speed)}`}
        </Badge>
      }
      fallback={
        <PlaybackPlaceholder
          camera={camera}
          playback={playback}
        />
      }
      getSnapshotDate={getSnapshotDate}
      key={sessionKey ?? 'idle'}
      onReconnect={reconnect}
      onStateChange={handlePlayerState}
      paused={isPaused}
      stream={stream}
      title={camera.name}
    />
  );
}
