import {Box, Text} from '@radix-ui/themes';
import type {ReactNode} from 'react';
import {useCallback} from 'react';
import {useNavigate} from 'react-router';
import {ROUTES} from '@/shared/config/routes';
import type {StreamInfo} from '@/mocks/data/nvrtypes';
import {useWebRtcPlayer} from '@/mocks/handlers/webrtc';
import styles from './CameraCard.module.scss';

interface CameraCardProps {
  className?: string;
  camData?: string;
  children?: ReactNode;
}

// Совпадает с захардкоженным потоком ниже (cam-1), пока карточка не получает камеру через props (M-2, M-5)
const currCamId = 'cam-1';

export function CameraCard(props: CameraCardProps) {
  const {className, children} = props;

  const navigate = useNavigate();

  const stream: StreamInfo = {
    cameraId: 'cam-1',
    codec: 'H.265',
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    fps: 25,
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
    protocol: 'webrtc',
    resolution: '2688x1520',
    whepUrl: '/api/webrtc/cam-1/whep',
  };

  const {videoRef} = useWebRtcPlayer(stream, 'Входная дверь');

  const openCamPage = useCallback(() => {
    navigate(ROUTES.cameraDetail(currCamId));
  }, [navigate]);

  return (
    <Box className={`${styles.cameraCard} ${className || ''}`}>
      {children ? (
        children
      ) : (
        <button className={styles.cameraCard__overlay} onClick={openCamPage} type='button'>
          <Text color='indigo'>Открыть</Text>
        </button>
      )}
      <video autoPlay className={styles.cameraCard__video} muted playsInline ref={videoRef} />
    </Box>
  );
}
