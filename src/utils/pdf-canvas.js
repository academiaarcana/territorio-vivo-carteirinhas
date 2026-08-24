export function inspectCanvasContent(canvas, {
  maxSamples = 60000,
  whiteThreshold = 248,
  minAlpha = 12,
  minNonBlankSamples = null
} = {}) {
  const width = Number(canvas?.width || 0);
  const height = Number(canvas?.height || 0);
  if (!canvas || width < 1 || height < 1 || typeof canvas.getContext !== 'function') {
    throw new Error('Canvas do PDF não possui dimensões válidas.');
  }

  const context = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
  if (!context || typeof context.getImageData !== 'function') {
    throw new Error('Canvas do PDF não permite validar o conteúdo capturado.');
  }

  let pixels;
  try {
    pixels = context.getImageData(0, 0, width, height).data;
  } catch (error) {
    const captureError = new Error('Não foi possível validar os pixels da captura do PDF.');
    captureError.code = 'PDF_CANVAS_UNREADABLE';
    captureError.cause = error;
    throw captureError;
  }

  const sampleLimit = Math.max(256, Math.floor(Number(maxSamples) || 60000));
  const aspect = width / height;
  const columns = Math.max(8, Math.min(width, Math.floor(Math.sqrt(sampleLimit * Math.max(aspect, 0.01)))));
  const rows = Math.max(8, Math.min(height, Math.floor(sampleLimit / columns)));
  const threshold = Math.max(0, Math.min(255, Number(whiteThreshold) || 248));
  const alphaThreshold = Math.max(0, Math.min(255, Number(minAlpha) || 12));

  let sampled = 0;
  let nonBlank = 0;
  for (let row = 0; row < rows; row += 1) {
    const y = Math.min(height - 1, Math.floor(((row + 0.5) * height) / rows));
    for (let column = 0; column < columns; column += 1) {
      const x = Math.min(width - 1, Math.floor(((column + 0.5) * width) / columns));
      const offset = ((y * width) + x) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const alpha = pixels[offset + 3];
      sampled += 1;
      if (alpha >= alphaThreshold && (red < threshold || green < threshold || blue < threshold)) {
        nonBlank += 1;
      }
    }
  }

  const minimum = Number.isFinite(Number(minNonBlankSamples))
    ? Math.max(1, Number(minNonBlankSamples))
    : Math.max(8, Math.ceil(sampled * 0.00015));

  return {
    width,
    height,
    sampled,
    nonBlank,
    minimum,
    blank: nonBlank < minimum
  };
}

export function assertCanvasHasContent(canvas) {
  const stats = inspectCanvasContent(canvas);
  if (stats.blank) {
    const error = new Error('A captura do PDF ficou vazia. O arquivo não foi gerado.');
    error.code = 'PDF_EMPTY_CANVAS';
    error.details = stats;
    throw error;
  }
  return stats;
}
