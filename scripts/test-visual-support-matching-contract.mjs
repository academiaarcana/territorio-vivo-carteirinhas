import assert from 'node:assert/strict';
import { visualSupportsFor } from '../src/lib/visual-support.js';

const supports = (subject) => visualSupportsFor(subject);
const ids = (subject) => supports(subject).map((item) => item.id);
const iconId = (subject) => supports(subject)[0]?.flaticon?.iconId;

assert.deepEqual(ids({ label: 'Recado ou preparo', value: 'Beber água' }), ['water']);
assert.deepEqual(ids({ label: 'Pessoa / família / referência', value: 'Criança' }), ['child']);
assert.deepEqual(ids({ label: 'Pessoa / família / referência', value: 'Documento' }), ['document']);
assert.deepEqual(ids({ label: 'Tentativa / contato realizado', value: 'População' }), ['population']);
assert.deepEqual(ids({ label: 'Próximo passo', value: 'População' }), ['population']);
assert.deepEqual(ids({ label: 'Motivo', value: 'Localização' }), ['location']);
assert.deepEqual(ids({ label: 'Recado ou preparo', value: 'Receita' }), ['prescription']);
assert.deepEqual(ids({ label: 'Recado ou preparo', value: 'Acompanhante' }), ['companion']);

assert.equal(iconId({ value: 'Criança' }), '3037662');
assert.equal(iconId({ value: 'Acompanhante' }), '17583651');
assert.equal(iconId({ value: 'Receita' }), '843180');
assert.equal(iconId({ value: 'Grupo' }), '9634305');
assert.equal(iconId({ value: 'Ação' }), '12244858');

console.log('Contrato visual OK: conteúdo prevalece sobre rótulo e substrings não geram pictogramas extras.');
