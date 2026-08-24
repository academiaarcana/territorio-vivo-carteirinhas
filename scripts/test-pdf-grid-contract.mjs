import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertCardsSheetGeometry } from '../src/utils/pdf-geometry.js';

const css = fs.readFileSync('src/styles/pdf-capture.css', 'utf8');
const print = fs.readFileSync('src/utils/print.js', 'utf8');

function rect(left, top, width, height) {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

function gridRects({ columns, rows, width = 194, height = 281, gapX = 4, gapY = 4 }) {
  const cellWidth = (width - ((columns - 1) * gapX)) / columns;
  const cellHeight = (height - ((rows - 1) * gapY)) / rows;
  return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => (
    rect(column * (cellWidth + gapX), row * (cellHeight + gapY), cellWidth, cellHeight)
  ))).flat();
}

const sheet = rect(0, 0, 194, 281);
const shapes = {
  2: { columns: 2, rows: 1 },
  4: { columns: 2, rows: 2 },
  8: { columns: 2, rows: 4 },
  12: { columns: 3, rows: 4 }
};

for (const [countText, shape] of Object.entries(shapes)) {
  const count = Number(countText);
  const valid = gridRects(shape);
  assert.doesNotThrow(
    () => assertCardsSheetGeometry(valid, sheet, count),
    `${count}/A4 precisa aceitar a grade ${shape.columns} × ${shape.rows}.`
  );

  const wrongOrder = [...valid];
  if (wrongOrder.length > 1) [wrongOrder[0], wrongOrder[1]] = [wrongOrder[1], wrongOrder[0]];
  assert.throws(
    () => assertCardsSheetGeometry(wrongOrder, sheet, count),
    (error) => ['PDF_SHEET_GEOMETRY', 'PDF_FOUR_UP_GEOMETRY'].includes(error?.code),
    `${count}/A4 precisa rejeitar posições fora da ordem geométrica.`
  );

  assert.throws(
    () => assertCardsSheetGeometry(valid.slice(0, -1), sheet, count),
    (error) => ['PDF_SHEET_GEOMETRY', 'PDF_FOUR_UP_GEOMETRY'].includes(error?.code),
    `${count}/A4 precisa rejeitar quantidade incompleta.`
  );
}

const twelveOutside = gridRects(shapes[12]);
twelveOutside[11] = rect(150, 270, 45, 30);
assert.throws(
  () => assertCardsSheetGeometry(twelveOutside, sheet, 12),
  (error) => ['PDF_PAGE_OVERFLOW', 'PDF_SHEET_GEOMETRY'].includes(error?.code),
  '12/A4 precisa rejeitar a última posição quando ela ultrapassa a folha.'
);

assert.match(css, /card-sheet\.count-2[\s\S]*grid-template-columns:\s*repeat\(2,[\s\S]*grid-template-rows:\s*minmax\(0, 1fr\)/, 'CSS 2/A4 precisa manter 2 × 1.');
assert.match(css, /card-sheet\.count-4[\s\S]*grid-template-columns:\s*repeat\(2,[\s\S]*grid-template-rows:\s*repeat\(2,/, 'CSS 4/A4 precisa manter 2 × 2.');
assert.match(css, /card-sheet\.count-8[\s\S]*grid-template-columns:\s*repeat\(2,[\s\S]*grid-template-rows:\s*repeat\(4,/, 'CSS 8/A4 precisa manter 2 × 4.');
assert.match(css, /card-sheet\.count-12[\s\S]*grid-template-columns:\s*repeat\(3,[\s\S]*grid-template-rows:\s*repeat\(4,/, 'CSS 12/A4 precisa manter 3 × 4.');
assert.match(print, /\[2, 4, 8, 12\]/, 'Gerador precisa aceitar somente as quatro densidades A4 homologáveis.');

console.log('Contrato das grades PDF OK: 2×1, 2×2, 2×4 e 3×4 validados por geometria e CSS.');
