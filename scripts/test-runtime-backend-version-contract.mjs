import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const config = fs.readFileSync('config.js', 'utf8');

const projectRef = config.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
assert.ok(projectRef, 'config.js precisa declarar um projeto Supabase hospedado válido.');

assert.match(
  index,
  new RegExp(`config\\.js\\?v=${projectRef}`),
  'config.js precisa usar o project ref atual como cache-buster para impedir configuração antiga após troca do backend.'
);

assert.match(
  index,
  /@supabase\/supabase-js@2\.112\.4/,
  'SDK Supabase do navegador precisa permanecer fixado em uma versão exata auditada.'
);
assert.doesNotMatch(
  index,
  /@supabase\/supabase-js@2(?:["'\/])/,
  'Produção não pode voltar a carregar uma versão flutuante da série 2 do SDK Supabase.'
);

console.log(`Contrato de runtime OK: backend ${projectRef} com cache-buster e SDK Supabase fixado.`);
