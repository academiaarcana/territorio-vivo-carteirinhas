import assert from 'node:assert/strict';
import fs from 'node:fs';

const repository = fs.readFileSync('src/services/repository.js', 'utf8');
const helperBlock = repository.match(/function normalizeCoordinate[\s\S]*?\n}\n\nexport async function getProfile/)?.[0]
  ?.replace(/\n\nexport async function getProfile[\s\S]*$/, '');

assert.ok(helperBlock, 'Funções puras de normalização de coordenadas precisam permanecer localizáveis no serviço.');
const { normalizeCoordinates } = new Function(`${helperBlock}\nreturn { normalizeCoordinates };`)();

assert.deepEqual(
  normalizeCoordinates({ latitude: '-11,67', longitude: '-61,19' }),
  { latitude: -11.67, longitude: -61.19 },
  'Coordenadas com vírgula decimal precisam ser aceitas.'
);
assert.deepEqual(
  normalizeCoordinates({ latitude: '-11.67', longitude: '-61.19' }),
  { latitude: -11.67, longitude: -61.19 },
  'Coordenadas com ponto decimal precisam ser aceitas.'
);
assert.deepEqual(
  normalizeCoordinates({ latitude: '-90', longitude: '-180' }),
  { latitude: -90, longitude: -180 },
  'Limites inferiores válidos precisam ser aceitos.'
);
assert.deepEqual(
  normalizeCoordinates({ latitude: '90', longitude: '180' }),
  { latitude: 90, longitude: 180 },
  'Limites superiores válidos precisam ser aceitos.'
);
assert.deepEqual(
  normalizeCoordinates({ latitude: '', longitude: '' }),
  { latitude: null, longitude: null },
  'Par vazio precisa ser normalizado para nulo.'
);
assert.deepEqual(normalizeCoordinates({ name: 'Praça' }), {}, 'Payload sem coordenadas não deve ganhar campos geográficos.');

for (const payload of [
  { latitude: '90.0001', longitude: '0' },
  { latitude: '-90.0001', longitude: '0' },
  { latitude: '0', longitude: '180.0001' },
  { latitude: '0', longitude: '-180.0001' },
  { latitude: 'NaN', longitude: '0' },
  { latitude: 'Infinity', longitude: '0' }
]) {
  assert.throws(() => normalizeCoordinates(payload), /inválida/, 'Valor fora da faixa ou não finito precisa ser rejeitado.');
}

assert.throws(
  () => normalizeCoordinates({ latitude: '-11.67' }),
  /Informe latitude e longitude juntas/,
  'Latitude sem longitude precisa ser rejeitada.'
);
assert.throws(
  () => normalizeCoordinates({ longitude: '-61.19' }),
  /Informe latitude e longitude juntas/,
  'Longitude sem latitude precisa ser rejeitada.'
);
assert.throws(
  () => normalizeCoordinates({ latitude: '-11.67', longitude: '' }),
  /Informe latitude e longitude juntas/,
  'Um valor preenchido e outro vazio precisa ser rejeitado.'
);

console.log('Contrato de coordenadas OK: vírgula/ponto, limites, par obrigatório e valores não finitos validados por comportamento.');
