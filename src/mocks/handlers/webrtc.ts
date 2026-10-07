import { useEffect, useRef, useState } from 'react';
import type { StreamInfo } from '../data/nvrtypes';

export type PlayerState = 'idle' | 'connecting' | 'playing' | 'failed';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Тестовая картинка вместо реального видео (MSW не умеет отдавать медиа) */
function createMockMediaStream(label: string): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;
  const draw = () => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a9d5c';
    ctx.font = '28px sans-serif';
    ctx.fillText(label, 24, 48);
    ctx.fillStyle = '#ddd';
    ctx.font = '20px monospace';
    ctx.fillText(new Date().toLocaleTimeString(), 24, canvas.height - 24);
  };
  draw();
  const timer = setInterval(draw, 200);
  const media = canvas.captureStream(25);
  media.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer));
  return media;
}

function waitForIceGathering(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
    setTimeout(resolve, 2000); // не ждём дольше 2 с
  });
}

/**
 * Подключает WebRTC-поток (WHEP) к <video>.
 * Использование:
 *   const { videoRef, state } = useWebRtcPlayer(stream, 'Входная дверь');
 *   <video ref={videoRef} autoPlay muted playsInline />
 */
export function useWebRtcPlayer(stream: StreamInfo | undefined, label = 'Camera') {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlayerState>('idle');

  useEffect(() => {
    if (!stream) return;
    const video = videoRef.current;
    if (!video) return;

    setState('connecting');

    if (USE_MOCKS) {
      video.srcObject = createMockMediaStream(label);
      setState('playing');
      return () => {
        video.srcObject = null;
      };
    }

    const pc = new RTCPeerConnection({ iceServers: stream.iceServers });
    let sessionUrl: string | null = null;
    let cancelled = false;

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.ontrack = (e) => {
      video.srcObject = e.streams[0];
      setState('playing');
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') setState('failed');
    };

    (async () => {
      try {
        await pc.setLocalDescription(await pc.createOffer());
        await waitForIceGathering(pc);
        const res = await fetch(stream.whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription!.sdp,
        });
        if (!res.ok) throw new Error(`WHEP ${res.status}`);
        sessionUrl = res.headers.get('Location');
        const answer = await res.text();
        if (!cancelled) await pc.setRemoteDescription({ type: 'answer', sdp: answer });
      } catch {
        if (!cancelled) setState('failed');
      }
    })();

    return () => {
      cancelled = true;
      pc.close();
      video.srcObject = null;
      if (sessionUrl) fetch(sessionUrl, { method: 'DELETE' }).catch(() => {});
    };
  }, [stream, label]);

  return { videoRef, state };
}