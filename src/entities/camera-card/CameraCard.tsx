import styles from './CameraCard.module.scss'
import type { StreamInfo } from '@/mocks/data/nvrtypes'
import { useWebRtcPlayer } from '@/mocks/handlers/webrtc'
import { Box } from '@radix-ui/themes';

interface CameraCardProps {
  camData?: string,
}

export function CameraCard(props: CameraCardProps) {
  // const {
  //   camData,
  // } = props;

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

  return (
    <Box className={styles.cameraCard}>
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