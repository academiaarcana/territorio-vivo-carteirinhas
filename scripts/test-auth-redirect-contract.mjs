import assert from 'node:assert/strict';
import { resolveAuthRedirectUrl } from '../src/lib/auth-redirect.js';

const publicUrl = 'https://territoriovivo.github.io/territorio-vivo-carteirinhas/';

assert.equal(resolveAuthRedirectUrl({
  publicUrl,
  currentUrl: 'https://territoriovivo.github.io/territorio-vivo-carteirinhas/#/criar-conta'
}), publicUrl, 'Produção precisa usar a URL pública canônica.');

assert.equal(resolveAuthRedirectUrl({
  publicUrl,
  currentUrl: 'https://site-nao-autorizado.example/app/'
}), publicUrl, 'Origem externa não pode substituir a URL pública canônica.');

assert.equal(resolveAuthRedirectUrl({
  publicUrl,
  currentUrl: 'http://localhost:3000/#/criar-conta'
}), 'http://localhost:3000/', 'Homologação em localhost precisa retornar ao servidor local.');

assert.equal(resolveAuthRedirectUrl({
  publicUrl,
  currentUrl: 'http://127.0.0.1:3000/territorio-vivo-carteirinhas/index.html#/entrar',
  recovery: true
}), 'http://127.0.0.1:3000/territorio-vivo-carteirinhas/?recovery=1', 'Recuperação local precisa preservar o diretório e marcar o callback.');

console.log('Contrato de redirects do Auth OK: produção canônica e loopback local restrito.');
