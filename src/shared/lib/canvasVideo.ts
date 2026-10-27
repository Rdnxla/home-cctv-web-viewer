interface Hill {
  amp: number;
  base: number;
  color: string;
  freq: number;
  phase: number;
  trees: number[];
}

interface LandscapeFrame {
  caption: string;
  seconds: number;
  title: string;
}

const HILLS: Hill[] = [
  {amp: 18, base: 0.62, color: '#c06c84', freq: 0.011, phase: 0, trees: []},
  {amp: 24, base: 0.74, color: '#6c5b7b', freq: 0.008, phase: 2, trees: [70, 96, 124, 470, 500]},
  {amp: 12, base: 0.87, color: '#355c7d', freq: 0.014, phase: 4, trees: []},
];

const CLOUDS = [
  {speed: 10, x: 40, y: 64},
  {speed: 6, x: 360, y: 104},
];

const CLOUD_PUFFS = [
  [0, 0, 40, 11],
  [18, -7, 22, 10],
  [-16, -4, 18, 8],
] as const;

function hillY(hill: Hill, x: number, height: number) {
  return height * hill.base + Math.sin(x * hill.freq + hill.phase) * hill.amp;
}

// `seconds` drives cloud drift, so callers can pass a frozen or sped-up clock
function drawLandscapeFrame(ctx: CanvasRenderingContext2D, {caption, seconds, title}: LandscapeFrame) {
  const {width, height} = ctx.canvas;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#3d348b');
  sky.addColorStop(0.55, '#e26d5c');
  sky.addColorStop(1, '#ffc971');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#fff1c1';
  ctx.beginPath();
  ctx.arc(width * 0.7, height * 0.56, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  for (const cloud of CLOUDS) {
    const cx = ((cloud.x + seconds * cloud.speed) % (width + 120)) - 60;
    ctx.beginPath();
    // moveTo to each ellipse's start point so the puffs don't get joined by stray line segments
    for (const [dx, dy, rx, ry] of CLOUD_PUFFS) {
      ctx.moveTo(cx + dx + rx, cloud.y + dy);
      ctx.ellipse(cx + dx, cloud.y + dy, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  for (const hill of HILLS) {
    ctx.fillStyle = hill.color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      ctx.lineTo(x, hillY(hill, x, height));
    }
    ctx.lineTo(width, height);
    ctx.fill();

    ctx.fillStyle = '#2a3d5c';
    for (const x of hill.trees) {
      const y = hillY(hill, x, height);
      ctx.beginPath();
      ctx.moveTo(x, y - 34);
      ctx.lineTo(x + 10, y + 6);
      ctx.lineTo(x - 10, y + 6);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px sans-serif';
  ctx.fillText(title, 24, 48);
  ctx.fillStyle = '#f8f1e5';
  ctx.font = '20px monospace';
  ctx.fillText(caption, 24, height - 24);
}

function createCanvasStream(draw: (ctx: CanvasRenderingContext2D) => void, intervalMs: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  const tick = () => {
    if (ctx) draw(ctx);
  };

  tick();
  const timer = setInterval(tick, intervalMs);
  const stream = canvas.captureStream(25);

  return {
    stop: () => {
      clearInterval(timer);
      stream.getTracks().forEach(t => {
        t.stop();
      });
    },
    stream,
  };
}

export {createCanvasStream, drawLandscapeFrame};
