import assert from 'node:assert/strict';
import fs from 'node:fs';

const permissions = fs.readFileSync('src/core/permissions.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
const profile = fs.readFileSync('src/pages/profile.js', 'utf8');
const territory = fs.readFileSync('src/pages/territory.js', 'utf8');

assert.match(permissions, /ROLES\.ADMIN\) return 'Conta Master'/, 'Papel superior deve ser identificado como Conta Master.');
assert.match(layout, /Administração geral • Rede cadastrada/, 'Shell do master não deve exibir UBS ou equipe como escopo da conta.');
assert.match(layout, /Território Vivo • Administração superior/, 'Cabeçalho do master deve comunicar administração superior.');
assert.match(layout, /Conta Master • Administração geral/, 'Cartão da conta deve identificar explicitamente o master.');
assert.match(dashboard, /Toda a rede cadastrada/, 'Painel Master deve declarar escopo de rede completa.');
assert.match(dashboard, /title: master \? 'Painel Master' : 'Início'/, 'Título do dashboard deve diferenciar a conta master.');
assert.match(profile, /Conta Master — Administração geral/, 'Perfil deve explicar o papel superior.');
assert.match(profile, /não limitam seu acesso/, 'Vínculo histórico deve ser apresentado apenas como preferência de materiais.');
assert.match(territory, /Visão geral da rede/, 'Território do master não deve ser limitado a um município.');

console.log('Contrato da interface master OK: conta superior, rede completa e contexto de materiais sem falso vínculo operacional.');
