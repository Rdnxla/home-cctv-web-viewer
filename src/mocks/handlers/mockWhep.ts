/**
 * Мок «серверной» стороны WHEP.
 * MSW-хендлеры работают в основном потоке страницы, поэтому здесь можно
 * поднять настоящий RTCPeerConnection и отдать плееру реальный SDP answer
 * с видеотреком из canvas. Плеер при этом работает по обычному боевому пути.
 */

import {createCanvasStream, drawLandscapeFrame} from '@/shared/lib/canvasVideo';
import {waitForIceGathering} from '@/shared/lib/waitForIceGathering';

interface Session {
  pc: RTCPeerConnection;
  stop: () => void;
}

interface PlaybackClock {
  from: number;
  speed: number;
}

const sessions = new Map<string, Session>();

function createMockVideo(label: string, playback?: PlaybackClock) {
  // Время архива идёт с момента ответа плееру (startClock), до этого кадр стоит на `from`
  let clockStartedAt: number | null = null;

  const getArchiveTime = (clock: PlaybackClock) =>
    clockStartedAt === null ? clock.from : clock.from + (Date.now() - clockStartedAt) * clock.speed;

  const media = createCanvasStream(ctx => {
    if (!playback) {
      drawLandscapeFrame(ctx, {caption: new Date().toLocaleTimeString(), seconds: Date.now() / 1000, title: label});
      return;
    }
    const archiveTime = getArchiveTime(playback);
    drawLandscapeFrame(ctx, {
      caption: new Date(archiveTime).toLocaleString('ru'),
      seconds: archiveTime / 1000,
      title: label,
    });
    ctx.fillStyle = '#e5a50a';
    ctx.font = '20px sans-serif';
    ctx.fillText(`АРХИВ ×${playback.speed}`, 24, 80);
  }, 100);

  return {
    ...media,
    startClock: () => {
      clockStartedAt ??= Date.now();
    },
  };
}

async function createMockWhepSession(offerSdp: string, label: string, playback?: PlaybackClock) {
  // STUN не нужен: обе стороны в одной вкладке
  const pc = new RTCPeerConnection({iceServers: []});
  const media = createMockVideo(label, playback);

  media.stream.getTracks().forEach(track => {
    pc.addTrack(track, media.stream);
  });

  await pc.setRemoteDescription({sdp: offerSdp, type: 'offer'});
  await pc.setLocalDescription(await pc.createAnswer());
  await waitForIceGathering(pc);
  media.startClock();

  const sessionId = `session-${crypto.randomUUID()}`;
  sessions.set(sessionId, {
    pc,
    stop: () => {
      media.stop();
      pc.close();
    },
  });

  // biome-ignore lint/style/noNonNullAssertion: <>
  return {answerSdp: pc.localDescription!.sdp, sessionId};
}

function closeMockWhepSession(sessionId: string) {
  sessions.get(sessionId)?.stop();
  sessions.delete(sessionId);
}

export {closeMockWhepSession, createMockWhepSession};
