/** Текущий кадр `<video>` в виде изображения. `null`, если кадра ещё нет. */
export function captureVideoFrame(video: HTMLVideoElement, type = 'image/png'): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return Promise.resolve(null);
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise(resolve => {
    canvas.toBlob(resolve, type);
  });
}
