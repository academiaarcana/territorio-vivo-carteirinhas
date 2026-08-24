const DEFAULT_TOLERANCE_PX = 2;

const CARD_GRID_SHAPES = Object.freeze({
  2: Object.freeze({ columns: 2, rows: 1 }),
  4: Object.freeze({ columns: 2, rows: 2 }),
  8: Object.freeze({ columns: 2, rows: 4 }),
  12: Object.freeze({ columns: 3, rows: 4 })
});

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

export function assertCardContentFits({
  cardRect,
  contentRects = [],
  scrollWidth = 0,
  clientWidth = 0,
  scrollHeight = 0,
  clientHeight = 0
} = {}, label = 'Carteirinha', { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  const card = normalizeRect(cardRect);
  if (card.width <= 0 || card.height <= 0) {
    throw geometryError('A carteirinha ficou sem dimensão válida para o PDF.', 'PDF_CARD_CONTENT_OVERFLOW');
  }

  try {
    assertNoBoxOverflow({ scrollWidth, clientWidth, scrollHeight, clientHeight }, label, { tolerance });
    assertRectsInside(card, contentRects, label, { tolerance });
  } catch (cause) {
    const error = geometryError('A carteirinha ficou maior que o espaço disponível na página A4. O PDF não foi gerado.', 'PDF_CARD_CONTENT_OVERFLOW');
    error.detail = cause?.detail || `${label}: conteúdo interno ultrapassou a área disponível.`;
    error.cause = cause;
    throw error;
  }

  return { card, contentRects: Array.from(contentRects || [], normalizeRect) };
}

export function assertSheetGridGeometry(slotRects, sheetRect, {
  columns,
  rows,
  tolerance = DEFAULT_TOLERANCE_PX,
  code = 'PDF_SHEET_GEOMETRY',
  label = 'Grade de carteirinhas'
} = {}) {
  const slots = Array.from(slotRects || [], normalizeRect);
  const sheet = normalizeRect(sheetRect);
  const expected = Number(columns) * Number(rows);
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1 || slots.length !== expected) {
    throw geometryError(`${label} não contém a quantidade esperada de posições.`, code);
  }

  assertRectsInside(sheet, slots, label, { tolerance });
  const reference = slots[0];
  const equalWidths = slots.every((slot) => approximatelyEqual(slot.width, reference.width, tolerance));
  const equalHeights = slots.every((slot) => approximatelyEqual(slot.height, reference.height, tolerance));
  if (!equalWidths || !equalHeights) {
    const error = geometryError(`${label} perdeu a uniformidade das posições.`, code);
    error.detail = { sheet, slots, columns, rows };
    throw error;
  }

  for (let row = 0; row < rows; row += 1) {
    const rowSlots = slots.slice(row * columns, (row + 1) * columns);
    const rowTop = rowSlots[0].top;
    if (!rowSlots.every((slot) => approximatelyEqual(slot.top, rowTop, tolerance))) {
      const error = geometryError(`${label} perdeu o alinhamento das linhas.`, code);
      error.detail = { sheet, slots, columns, rows, row };
      throw error;
    }
    for (let column = 1; column < columns; column += 1) {
      if (rowSlots[column - 1].right > rowSlots[column].left + tolerance) {
        throw geometryError(`${label} possui sobreposição horizontal.`, code);
      }
    }
  }

  for (let column = 0; column < columns; column += 1) {
    const columnSlots = Array.from({ length: rows }, (_, row) => slots[(row * columns) + column]);
    const columnLeft = columnSlots[0].left;
    if (!columnSlots.every((slot) => approximatelyEqual(slot.left, columnLeft, tolerance))) {
      const error = geometryError(`${label} perdeu o alinhamento das colunas.`, code);
      error.detail = { sheet, slots, columns, rows, column };
      throw error;
    }
    for (let row = 1; row < rows; row += 1) {
      if (columnSlots[row - 1].bottom > columnSlots[row].top + tolerance) {
        throw geometryError(`${label} possui sobreposição vertical.`, code);
      }
    }
  }

  if (columns > 1) {
    const firstRow = slots.slice(0, columns);
    for (let column = 1; column < columns; column += 1) {
      if (firstRow[column].left <= firstRow[column - 1].left + tolerance) {
        throw geometryError(`${label} perdeu a ordem das colunas.`, code);
      }
    }
  }
  if (rows > 1) {
    for (let row = 1; row < rows; row += 1) {
      if (slots[row * columns].top <= slots[(row - 1) * columns].top + tolerance) {
        throw geometryError(`${label} perdeu a ordem das linhas.`, code);
      }
    }
  }

  return { sheet, slots, columns, rows };
}

export function assertCardsSheetGeometry(slotRects, sheetRect, count, { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  const shape = CARD_GRID_SHAPES[Number(count)];
  if (!shape) throw geometryError('Quantidade de carteirinhas não possui grade A4 conhecida.', 'PDF_SHEET_GEOMETRY');
  return assertSheetGridGeometry(slotRects, sheetRect, {
    ...shape,
    tolerance,
    code: Number(count) === 4 ? 'PDF_FOUR_UP_GEOMETRY' : 'PDF_SHEET_GEOMETRY',
    label: `Grade ${count}/A4`
  });
}

export function assertFourUpGeometry(slotRects, sheetRect, { tolerance = DEFAULT_TOLERANCE_PX } = {}) {
  return assertCardsSheetGeometry(slotRects, sheetRect, 4, { tolerance });
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
  const expectedPageHeightPx = Math.floor(width * (targetHeight / targetWidth));
  if (relativeDrift > maxRelativeDrift || height > expectedPageHeightPx) {
    const error = geometryError('A captura do PDF ficou com proporção incompatível com uma única página A4.', 'PDF_CANVAS_GEOMETRY');
    error.detail = { width, height, actualAspect, expectedAspect, relativeDrift, expectedPageHeightPx };
    throw error;
  }

  return { width, height, actualAspect, expectedAspect, relativeDrift, expectedPageHeightPx };
}
