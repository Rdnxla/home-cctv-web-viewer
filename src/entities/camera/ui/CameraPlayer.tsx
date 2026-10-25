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
import {formatFps, formatResolution, formatSnapshotFileName} from '@/shared/lib/format';
import {useFullscreen} from '@/shared/lib/useFullscreen';
import type {StreamInfo} from '@/api/cameras/types';
import type {PlayerState} from '@/api/cameras/useWebRtcPlayer';
import {useWebRtcPlayer} from '@/api/cameras/useWebRtcPlayer';
import styles from './CameraPlayer.module.scss';

interface FullscreenControl {
  isActive: boolean;
  isSupported: boolean;
  toggle: () => void;
}

interface CameraPlayerProps {
  badge?: ReactNode;
  className?: string | undefined;
  fallback?: ReactNode;
  getSnapshotDate?: (() => Date) | undefined;
  onReconnect?: (() => void) | undefined;
  onStateChange?: ((state: PlayerState) => void) | undefined;
  paused?: boolean | undefined;
  stream: StreamInfo | undefined;
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

interface ToolbarButtonProps {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function ToolbarButton(props: ToolbarButtonProps) {
  const {disabled = false, icon, label, onClick} = props;
  return (
    <Tooltip content={label}>
      <IconButton
        aria-label={label}
        color='gray'
        disabled={disabled}
        onClick={onClick}
        variant='soft'
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
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
          <Text
            color='gray'
            size='2'
          >
            Подключение к камере…
          </Text>
        </div>
      ) : null}

      {state === 'failed' ? (
        <div className={styles.cameraPlayer__center}>
          <Text
            as='span'
            color='red'
          >
            <ExclamationTriangleIcon
              aria-hidden='true'
              height={32}
              width={32}
            />
          </Text>
          <Text size='2'>Не удалось подключиться к видеопотоку</Text>
          <Button
            onClick={onReconnect}
            size='2'
            variant='soft'
          >
            <ReloadIcon />
            Переподключить
          </Button>
        </div>
      ) : null}

      {isPlaying ? (
        <Flex
          className={styles.cameraPlayer__badges}
          gap='2'
        >
          {badge ?? (
            <Badge
              color='red'
              size='1'
              variant='solid'
            >
              <span
                aria-hidden='true'
                className={styles.cameraPlayer__liveDot}
              />
              LIVE
            </Badge>
          )}
          {summary ? (
            <Badge
              color='gray'
              size='1'
              variant='surface'
            >
              {summary}
            </Badge>
          ) : null}
        </Flex>
      ) : null}

      {stream ? (
        <Flex
          className={styles.cameraPlayer__toolbar}
          gap='2'
          justify='end'
        >
          <ToolbarButton
            icon={<ReloadIcon />}
            label='Переподключить'
            onClick={onReconnect}
          />
          <ToolbarButton
            disabled={!isPlaying}
            icon={<CameraIcon />}
            label='Сделать снимок'
            onClick={takeSnapshot}
          />
          {fullscreen.isSupported ? (
            <ToolbarButton
              icon={fullscreen.isActive ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
              label={fullscreen.isActive ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
              onClick={fullscreen.toggle}
            />
          ) : null}
        </Flex>
      ) : null}
    </>
  );
}

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
    <Theme
      appearance='dark'
      className={`${styles.cameraPlayer} ${className ?? ''}`}
      hasBackground={false}
      ref={ref}
    >
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
