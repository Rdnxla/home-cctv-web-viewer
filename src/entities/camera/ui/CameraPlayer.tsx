import {
  CameraIcon,
  EnterFullScreenIcon,
  ExclamationTriangleIcon,
  ExitFullScreenIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import {Badge, Button, Flex, IconButton, Spinner, Text, Theme, Tooltip} from '@radix-ui/themes';
import type {ReactNode} from 'react';
import {useCallback, useState} from 'react';
import {captureVideoFrame} from '@/shared/lib/captureVideoFrame';
import {downloadBlob} from '@/shared/lib/downloadBlob';
import {useFullscreen} from '@/shared/lib/useFullscreen';
// Legacy (FSD-001, roadmap M-2): плеер пока лежит в src/mocks
import {useWebRtcPlayer} from '@/mocks/handlers/webrtc';
import {formatFps, formatResolution, formatSnapshotFileName} from '../lib/format';
import type {StreamInfo} from '../model/types';
import styles from './CameraPlayer.module.scss';

interface FullscreenControl {
  isActive: boolean;
  isSupported: boolean;
  toggle: () => void;
}

interface CameraPlayerProps {
  className?: string | undefined;
  /** Содержимое вместо видео, пока параметров потока нет (камера не в сети, параметры загружаются и т.п.) */
  fallback?: ReactNode;
  stream: StreamInfo | undefined;
  /** Название камеры: подпись видео и имя файла снимка */
  title: string;
}

interface PlayerSurfaceProps {
  fallback: ReactNode;
  fullscreen: FullscreenControl;
  onReconnect: () => void;
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
  const {fallback, fullscreen, onReconnect, stream, title} = props;
  const {state, videoRef} = useWebRtcPlayer(stream, title);
  const isPlaying = state === 'playing';
  const summary = stream ? getStreamSummary(stream) : '';

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    captureVideoFrame(video)
      .then(blob => {
        if (blob) downloadBlob(blob, formatSnapshotFileName(title));
      })
      .catch(() => ({}));
  }, [title, videoRef]);

  return (
    <>
      <video
        aria-label={`Видео с камеры «${title}»`}
        autoPlay
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
          <Badge color='red' size='1' variant='solid'>
            <span aria-hidden='true' className={styles.cameraPlayer__liveDot} />
            LIVE
          </Badge>
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
 * Живое видео камеры (WHEP) с оверлеями состояния и панелью действий:
 * переподключение, снимок кадра, полноэкранный режим.
 */
export function CameraPlayer(props: CameraPlayerProps) {
  const {className, fallback, stream, title} = props;
  const {isFullscreen, isSupported, ref, toggle} = useFullscreen<HTMLDivElement>();
  // Переподключение = пересоздание поверхности плеера: старая WHEP-сессия закрывается, открывается новая
  const [session, setSession] = useState(0);

  const reconnect = useCallback(() => {
    setSession(value => value + 1);
  }, []);

  return (
    <Theme appearance='dark' className={`${styles.cameraPlayer} ${className ?? ''}`} hasBackground={false} ref={ref}>
      <PlayerSurface
        fallback={fallback}
        fullscreen={{isActive: isFullscreen, isSupported, toggle}}
        key={session}
        onReconnect={reconnect}
        stream={stream}
        title={title}
      />
    </Theme>
  );
}
