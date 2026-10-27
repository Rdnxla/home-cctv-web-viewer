import {useEffect, useRef, useState} from 'react';
import {createCanvasStream, drawLandscapeFrame} from '@/shared/lib/canvasVideo';
import {waitForIceGathering} from '@/shared/lib/waitForIceGathering';
import type {StreamInfo} from './types';

type PlayerState = 'idle' | 'connecting' | 'playing' | 'failed';

function createMockMediaStream(label: string) {
  return createCanvasStream(ctx => {
    drawLandscapeFrame(ctx, {caption: new Date().toLocaleTimeString(), seconds: Date.now() / 1000, title: label});
  }, 200);
}

function useWebRtcPlayer(stream: StreamInfo | undefined, label = 'Camera') {
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

    if ((globalThis as {__MSW_ACTIVE__?: boolean}).__MSW_ACTIVE__) {
      const mock = createMockMediaStream(labelRef.current);
      video.srcObject = mock.stream;
      video.play().catch(() => ({}));
      setState('playing');
      return () => {
        mock.stop();
        video.srcObject = null;
      };
    }

    const pc = new RTCPeerConnection({iceServers: JSON.parse(iceKey || '[]')});
    const abort = new AbortController();
    let sessionUrl: string | null = null;

    pc.addTransceiver('video', {direction: 'recvonly'});
    pc.ontrack = e => {
      video.srcObject = e.streams[0] ?? null;
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
          body: pc.localDescription?.sdp ?? null,
          headers: {'Content-Type': 'application/sdp'},
          method: 'POST',
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`WHEP ${res.status}`);
        sessionUrl = res.headers.get('Location');
        await pc.setRemoteDescription({sdp: await res.text(), type: 'answer'});
      } catch {
        if (!abort.signal.aborted) setState('failed');
      }
    })();

    return () => {
      abort.abort();
      pc.close();
      video.srcObject = null;
      if (sessionUrl) fetch(sessionUrl, {method: 'DELETE'}).catch(() => ({}));
    };
  }, [whepUrl, iceKey]);

  return {state, videoRef};
}

export type {PlayerState};
export {useWebRtcPlayer};
