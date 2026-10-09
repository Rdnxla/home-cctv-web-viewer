import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import styles from './CameraCard.module.scss'
import { useWebRtcPlayer } from '@/mocks/handlers/webrtc'
import { Box, Text } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import type { StreamInfo } from '@/mocks/data/nvrtypes'

interface CameraCardProps {
  className?: string,
  camData?: string,
  children?: ReactNode,
}

const currCamId = 1;

export function CameraCard(props: CameraCardProps) {
  const {
    className,
    children,
  } = props;

  const navigate = useNavigate();

  const stream: StreamInfo = {
    cameraId: 'cam-1',
    protocol: 'webrtc',
    whepUrl: '/api/webrtc/cam-1/whep',
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    codec: 'H.265',
    resolution: '2688x1520',
    fps: 25,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  }

  const { videoRef } = useWebRtcPlayer(stream, 'Входная дверь');

  const openCamPage = useCallback(() => {
    navigate(`/${currCamId}/detail`);
  }, [navigate])

  return (
    <Box className={`${styles.cameraCard} ${className || ''}`}>
      {
        children ? children : (
          <button
            className={styles.cameraCard__overlay}
            onClick={openCamPage}
            type='button'
          >
            <Text color='indigo'>Открыть</Text>
          </button>
        )
      }
      <video
        autoPlay
        className={styles.cameraCard__video}
        muted
        playsInline
        ref={videoRef}
      />
    </Box>
  );
}