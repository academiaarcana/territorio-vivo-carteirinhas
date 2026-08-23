const DEFAULT_TOLERANCE_PX = 2;

function geometryError(message, code = 'PDF_PAGE_GEOMETRY') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function finite(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeRect(rect = {}) {
  const left = finite(rect.left ?? rect.x);
  const top = finite(rect.top ?? rect.y);
  const width = finite(rect.width, finite(rect.right) - left);
  const height = finite(rect.height, finite(rect.bottom) - top);
  const right = Number.isFinite(Number(rect.right)) ? Number(rect.right) : left + width;
  const bottom = Number.isFinite(Number(rect.bottom)) ? Number(rect.bottom) : top + height;
  return { left, top, right, bottom, width, height };
}

function approximatelyEqual(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}

export function assertNoBoxOverflow(metrics = {}, label = 'Área do PDF', { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  const scrollWidth = finite(metrics.scrollWidth);
  const clientWidth = finite(metrics.clientWidth);
  const scrollHeight = finite(metrics.scrollHeight);
  const clientHeight = finite(metrics.clientHeight);

  if (clientWidth > 0 && (scrollWidth - clientWidth) > tolerance) {
    const error = geometryError('O conteúdo não coube corretamente na página A4. O PDF não foi gerado.', 'PDF_PAGE_OVERFLOW');
    error.detail = `${label}: overflow horizontal de ${scrollWidth}px para ${clientWidth}px disponíveis.`;
    throw error;
  }
  if (clientHeight > 0 && (scrollHeight - clientHeight) > tolerance) {
    const error = geometryError('O conteúdo não coube corretamente na página A4. O PDF não foi gerado.', 'PDF_PAGE_OVERFLOW');
    error.detail = `${label}: overflow vertical de ${scrollHeight}px para ${clientHeight}px disponíveis.`;
    throw error;
  }
}

export function assertRectsInside(parentRect, childRects, label = 'Conteúdo do PDF', { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  const parent = normalizeRect(parentRect);
  const children = Array.from(childRects || [], normalizeRect);
  const outside = children.find((child) => (
    child.left < parent.left - tolerance
    || child.top < parent.top - tolerance
    || child.right > parent.right + tolerance
    || child.bottom > parent.bottom + tolerance
  ));
  if (outside) {
    const error = geometryError('O conteúdo não coube corretamente na página A4. O PDF não foi gerado.', 'PDF_PAGE_OVERFLOW');
    error.detail = `${label}: elemento ultrapassou os limites da área prevista.`;
    throw error;
  }
}

export function assertFourUpGeometry(slotRects, sheetRect, { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  const slots = Array.from(slotRects || [], normalizeRect);
  const sheet = normalizeRect(sheetRect);
  if (slots.length !== 4) {
    throw geometryError('A folha 4/A4 não contém exatamente quatro posições.', 'PDF_FOUR_UP_GEOMETRY');
  }

  assertRectsInside(sheet, slots, 'Grade 4/A4', { tolerance });
  const [one, two, three, four] = slots;

  const alignedRows = approximatelyEqual(one.top, two.top, tolerance)
    && approximatelyEqual(three.top, four.top, tolerance);
  const alignedColumns = approximatelyEqual(one.left, three.left, tolerance)
    && approximatelyEqual(two.left, four.left, tolerance);
  const orderedColumns = two.left > one.left + tolerance && four.left > three.left + tolerance;
  const orderedRows = three.top > one.top + tolerance && four.top > two.top + tolerance;
  const equalWidths = slots.every((slot) => approximatelyEqual(slot.width, one.width, tolerance));
  const equalHeights = slots.every((slot) => approximatelyEqual(slot.height, one.height, tolerance));
  const horizontalSeparation = one.right <= two.left + tolerance && three.right <= four.left + tolerance;
  const verticalSeparation = one.bottom <= three.top + tolerance && two.bottom <= four.top + tolerance;

  if (!alignedRows || !alignedColumns || !orderedColumns || !orderedRows
      || !equalWidths || !equalHeights || !horizontalSeparation || !verticalSeparation) {
    const error = geometryError('A grade 4/A4 perdeu o alinhamento 2 × 2 e o PDF não foi gerado.', 'PDF_FOUR_UP_GEOMETRY');
    error.detail = { sheet, slots };
    throw error;
  }

  return { sheet, slots };
}

export function assertCanvasAspect(canvas, expectedWidth, expectedHeight, { maxRelativeDrift = 0.03 } = {}) {
  const width = finite(canvas?.width);
  const height = finite(canvas?.height);
  const targetWidth = finite(expectedWidth);
  const targetHeight = finite(expectedHeight);
  if (width <= 0 || height <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    throw geometryError('Não foi possível validar a proporção da captura A4.', 'PDF_CANVAS_GEOMETRY');
  }

  const actualAspect = width / height;
  const expectedAspect = targetWidth / targetHeight;
  const relativeDrift = Math.abs(actualAspect - expectedAspect) / expectedAspect;
  if (relativeDrift > maxRelativeDrift) {
    const error = geometryError('A captura do PDF ficou com proporção incompatível com a área A4.', 'PDF_CANVAS_GEOMETRY');
    error.detail = { width, height, actualAspect, expectedAspect, relativeDrift };
    throw error;
  }

  return { width, height, actualAspect, expectedAspect, relativeDrift };
}
