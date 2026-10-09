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

const sessions = new Map<string, Session>();

function createCanvasStream(label: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  const draw = () => {
    ctx.fillStyle = '#123';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2bad5d';
    ctx.font = '28px sans-serif';
    ctx.fillText(label, 24, 48);
    ctx.fillStyle = '#aaa';
    ctx.font = '20px monospace';
    ctx.fillText(new Date().toLocaleTimeString(), 24, canvas.height - 24);
  };

  draw();
  const timer = setInterval(draw, 100);
  const stream = canvas.captureStream(25);

  return {
    stream,
    stop: () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

function waitForIce(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') resolve();
    });
    setTimeout(resolve, 2000);
  });
}

export async function createMockWhepSession(offerSdp: string, label: string) {
  // STUN не нужен: обе стороны в одной вкладке
  const pc = new RTCPeerConnection({ iceServers: [] });
  const media = createCanvasStream(label);

  media.stream.getTracks().forEach((track) => pc.addTrack(track, media.stream));

  await pc.setRemoteDescription({ type: 'offer', sdp: offerSdp });
  await pc.setLocalDescription(await pc.createAnswer());
  await waitForIce(pc);

  const sessionId = `session-${crypto.randomUUID()}`;
  sessions.set(sessionId, {
    pc,
    stop: () => {
      media.stop();
      pc.close();
    },
  });

  return { sessionId, answerSdp: pc.localDescription!.sdp };
}

export function closeMockWhepSession(sessionId: string) {
  sessions.get(sessionId)?.stop();
  sessions.delete(sessionId);
}