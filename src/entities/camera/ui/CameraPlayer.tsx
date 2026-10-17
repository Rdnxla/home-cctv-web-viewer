import {
  CameraIcon,
  EnterFullScreenIcon,
  ExclamationTriangleIcon,
  ExitFullScreenIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {Badge, Button, Flex, IconButton, Spinner, Text, Theme, Tooltip} from '@radix-ui/themes';
import type {ReactNode} from 'react';
import {useCallback, useEffect, useState} from 'react';
import {captureVideoFrame} from '@/shared/lib/captureVideoFrame';
import {downloadBlob} from '@/shared/lib/downloadBlob';
import {useFullscreen} from '@/shared/lib/useFullscreen';
// Legacy (FSD-001, roadmap M-2): плеер пока лежит в src/mocks
import {useWebRtcPlayer} from '@/mocks/handlers/webrtc';
import {formatFps, formatResolution, formatSnapshotFileName} from '../lib/format';
import type {PlayerState, StreamInfo} from '../model/types';
import styles from './CameraPlayer.module.scss';

interface FullscreenControl {
  isActive: boolean;
  isSupported: boolean;
  toggle: () => void;
}

interface CameraPlayerProps {
  /** Метка режима поверх видео; по умолчанию — LIVE */
  badge?: ReactNode;
  className?: string | undefined;
  /** Содержимое вместо видео, пока параметров потока нет (камера не в сети, параметры загружаются и т.п.) */
  fallback?: ReactNode;
  /** Момент показанного кадра для имени файла снимка; по умолчанию — текущее время */
  getSnapshotDate?: (() => Date) | undefined;
  /** Своя реакция на «Переподключить»; по умолчанию плеер сам пересоздаёт WHEP-сессию */
  onReconnect?: (() => void) | undefined;
  /** Состояние подключения: начало показа, ошибка */
  onStateChange?: ((state: PlayerState) => void) | undefined;
  /** Остановить картинку на текущем кадре; сеанс при этом не закрывается */
  paused?: boolean | undefined;
  stream: StreamInfo | undefined;
  /** Название камеры: подпись видео и имя файла снимка */
  title: string;
}

interface PlayerSurfaceProps {
  badge: ReactNode;
  fallback: ReactNode;
  fullscreen: FullscreenControl;
  getSnapshotDate: (() => Date) | undefined;
  onReconnect: () => void;
  onStateChange: ((state: PlayerState) => void) | undefined;
  paused: boolean;
  stream: StreamInfo | undefined;
  title: string;
}

function getStreamSummary(stream: StreamInfo) {
  const parts = [
    stream.resolution === null ? null : formatResolution(stream.resolution),
    stream.fps === null ? null : formatFps(stream.fps),
    stream.codec,
  ];
  return parts.filter(part => part !== null).join(' · ');
}

function PlayerSurface(props: PlayerSurfaceProps) {
  const {badge, fallback, fullscreen, getSnapshotDate, onReconnect, onStateChange, paused, stream, title} = props;
  const {state, videoRef} = useWebRtcPlayer(stream, title);
  const isPlaying = state === 'playing';
  const summary = stream ? getStreamSummary(stream) : '';

  useEffect(() => {
    onStateChange?.(state);
  }, [onStateChange, state]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      return;
    }
    if (video.srcObject !== null && video.paused) video.play().catch(() => ({}));
  }, [paused, videoRef]);

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const frameDate = getSnapshotDate?.();
    captureVideoFrame(video)
      .then(blob => {
        if (blob) downloadBlob(blob, formatSnapshotFileName(title, frameDate));
      })
      .catch(() => ({}));
  }, [getSnapshotDate, title, videoRef]);

  return (
    <>
      <video
        aria-label={`Видео с камеры «${title}»`}
        autoPlay={!paused}
        className={styles.cameraPlayer__video}
        muted
        playsInline
        ref={videoRef}
      />

      {stream ? null : <div className={styles.cameraPlayer__center}>{fallback}</div>}

      {state === 'connecting' ? (
        <div className={styles.cameraPlayer__center}>
          <Spinner size='3' />
          <Text color='gray' size='2'>
            Подключение к камере…
          </Text>
        </div>
      ) : null}

      {state === 'failed' ? (
        <div className={styles.cameraPlayer__center}>
          <Text as='span' color='red'>
            <ExclamationTriangleIcon aria-hidden='true' height={32} width={32} />
          </Text>
          <Text size='2'>Не удалось подключиться к видеопотоку</Text>
          <Button onClick={onReconnect} size='2' variant='soft'>
            <ReloadIcon />
            Переподключить
          </Button>
        </div>
      ) : null}

      {isPlaying ? (
        <Flex className={styles.cameraPlayer__badges} gap='2'>
          {badge ?? (
            <Badge color='red' size='1' variant='solid'>
              <span aria-hidden='true' className={styles.cameraPlayer__liveDot} />
              LIVE
            </Badge>
          )}
          {summary ? (
            <Badge color='gray' size='1' variant='surface'>
              {summary}
            </Badge>
          ) : null}
        </Flex>
      ) : null}

      {stream ? (
        <Flex className={styles.cameraPlayer__toolbar} gap='2' justify='end'>
          <Tooltip content='Переподключить'>
            <IconButton aria-label='Переподключить' color='gray' onClick={onReconnect} variant='soft'>
              <ReloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip content='Сделать снимок'>
            <IconButton
              aria-label='Сделать снимок'
              color='gray'
              disabled={!isPlaying}
              onClick={takeSnapshot}
              variant='soft'
            >
              <CameraIcon />
            </IconButton>
          </Tooltip>
          {fullscreen.isSupported ? (
            <Tooltip content={fullscreen.isActive ? 'Выйти из полноэкранного режима' : 'Во весь экран'}>
              <IconButton
                aria-label={fullscreen.isActive ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
                color='gray'
                onClick={fullscreen.toggle}
                variant='soft'
              >
                {fullscreen.isActive ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
              </IconButton>
            </Tooltip>
          ) : null}
        </Flex>
      ) : null}
    </>
  );
}

/**
 * Видео камеры (WHEP) с оверлеями состояния и панелью действий:
 * переподключение, снимок кадра, полноэкранный режим. По умолчанию — живое видео,
 * для архива потребитель задаёт метку, паузу и собственное переподключение.
 */
export function CameraPlayer(props: CameraPlayerProps) {
  const {
    badge,
    className,
    fallback,
    getSnapshotDate,
    onReconnect,
    onStateChange,
    paused = false,
    stream,
    title,
  } = props;
  const {isFullscreen, isSupported, ref, toggle} = useFullscreen<HTMLDivElement>();
  // Переподключение = пересоздание поверхности плеера: старая WHEP-сессия закрывается, открывается новая
  const [session, setSession] = useState(0);

  const reconnect = useCallback(() => {
    setSession(value => value + 1);
  }, []);

  return (
    <Theme appearance='dark' className={`${styles.cameraPlayer} ${className ?? ''}`} hasBackground={false} ref={ref}>
      <PlayerSurface
        badge={badge}
        fallback={fallback}
        fullscreen={{isActive: isFullscreen, isSupported, toggle}}
        getSnapshotDate={getSnapshotDate}
        key={session}
        onReconnect={onReconnect ?? reconnect}
        onStateChange={onStateChange}
        paused={paused}
        stream={stream}
        title={title}
      />
    </Theme>
  );
}
