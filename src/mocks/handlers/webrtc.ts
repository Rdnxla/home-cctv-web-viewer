import { useEffect, useRef, useState } from 'react';
import type { StreamInfo } from '../data/nvrtypes';

export type PlayerState = 'idle' | 'connecting' | 'playing' | 'failed';

/** Тестовая картинка вместо реального видео (MSW не умеет отдавать медиа) */
function createMockMediaStream(label: string) {
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
  const stream = canvas.captureStream(25);

  return {
    stream,
    stop: () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
    },
  };
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
    setTimeout(resolve, 2000);
  });
}

/**
 * Подключает WebRTC-поток (WHEP) к <video>.
 *   const { videoRef, state } = useWebRtcPlayer(stream, 'Входная дверь');
 *   <video ref={videoRef} autoPlay muted playsInline />
 */
export function useWebRtcPlayer(stream: StreamInfo | undefined, label = 'Camera') {
  const videoRef = useRef<HTMLVideoElement>(null);
  const labelRef = useRef(label);
  labelRef.current = label;
  const [state, setState] = useState<PlayerState>('idle');

  // Только примитивы: expiresAt и прочие поля при рефетче меняются,
  // но пересоздавать соединение из-за этого не нужно.
  const whepUrl = stream?.whepUrl;
  const iceKey = stream ? JSON.stringify(stream.iceServers) : '';

  useEffect(() => {
    const video = videoRef.current;
    if (!whepUrl || !video) {
      setState('idle');
      return;
    }

    setState('connecting');

    // --- Мок-режим: включается, когда запущен MSW ---
    if (window.__MSW_ACTIVE__) {
      const mock = createMockMediaStream(labelRef.current);
      video.srcObject = mock.stream;
      video.play().catch(() => {});
      setState('playing');
      return () => {
        mock.stop();
        video.srcObject = null;
      };
    }

    // --- Реальный WHEP ---
    const pc = new RTCPeerConnection({ iceServers: JSON.parse(iceKey || '[]') });
    const abort = new AbortController();
    let sessionUrl: string | null = null;

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
        const res = await fetch(whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription!.sdp,
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`WHEP ${res.status}`);
        sessionUrl = res.headers.get('Location');
        await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() });
      } catch {
        if (!abort.signal.aborted) setState('failed');
      }
    })();

    return () => {
      abort.abort();
      pc.close();
      video.srcObject = null;
      if (sessionUrl) fetch(sessionUrl, { method: 'DELETE' }).catch(() => {});
    };
  }, [whepUrl, iceKey]);

  return { videoRef, state };
}