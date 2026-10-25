/**
 * Мок «серверной» стороны WHEP.
 * MSW-хендлеры работают в основном потоке страницы, поэтому здесь можно
 * поднять настоящий RTCPeerConnection и отдать плееру реальный SDP answer
 * с видеотреком из canvas. Плеер при этом работает по обычному боевому пути.
 */

interface Session {
  pc: RTCPeerConnection;
  stop: () => void;
}

interface PlaybackClock {
  from: number;
  speed: number;
}

const sessions = new Map<string, Session>();

function createCanvasStream(label: string, playback?: PlaybackClock) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  // biome-ignore lint/style/noNonNullAssertion: <>
  const ctx = canvas.getContext('2d')!;
  // Время архива идёт с момента ответа плееру (startClock), до этого кадр стоит на `from`
  let clockStartedAt: number | null = null;

  const getArchiveTime = (clock: PlaybackClock) =>
    clockStartedAt === null ? clock.from : clock.from + (Date.now() - clockStartedAt) * clock.speed;

  const draw = () => {
    ctx.fillStyle = '#123';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2bad5d';
    ctx.font = '28px sans-serif';
    ctx.fillText(label, 24, 48);
    ctx.fillStyle = '#aaa';
    ctx.font = '20px monospace';
    if (playback) {
      ctx.fillText(new Date(getArchiveTime(playback)).toLocaleString('ru'), 24, canvas.height - 24);
      ctx.fillStyle = '#e5a50a';
      ctx.font = '20px sans-serif';
      ctx.fillText(`АРХИВ ×${playback.speed}`, 24, 80);
    } else {
      ctx.fillText(new Date().toLocaleTimeString(), 24, canvas.height - 24);
    }
  };

  draw();
  const timer = setInterval(draw, 100);
  const stream = canvas.captureStream(25);

  return {
    startClock: () => {
      clockStartedAt ??= Date.now();
    },
    stop: () => {
      clearInterval(timer);
      stream.getTracks().forEach(t => {
        t.stop();
      });
    },
    stream,
  };
}

function waitForIce(pc: RTCPeerConnection) {
  return new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve();
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') resolve();
    });
    setTimeout(resolve, 2000);
  });
}

export async function createMockWhepSession(offerSdp: string, label: string, playback?: PlaybackClock) {
  // STUN не нужен: обе стороны в одной вкладке
  const pc = new RTCPeerConnection({iceServers: []});
  const media = createCanvasStream(label, playback);

  media.stream.getTracks().forEach(track => {
    pc.addTrack(track, media.stream);
  });

  await pc.setRemoteDescription({sdp: offerSdp, type: 'offer'});
  await pc.setLocalDescription(await pc.createAnswer());
  await waitForIce(pc);
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

export function closeMockWhepSession(sessionId: string) {
  sessions.get(sessionId)?.stop();
  sessions.delete(sessionId);
}
