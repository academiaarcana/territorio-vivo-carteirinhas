import assert from 'node:assert/strict';
import fs from 'node:fs';

const pending = fs.readFileSync('src/pages/access-pending.js', 'utf8');

assert.match(pending, /let actionInFlight = false;/, 'Conta pendente precisa manter um lock compartilhado de ações.');
assert.match(pending, /function setPendingActionsBusy/, 'Conta pendente precisa bloquear em conjunto verificar, sair e salvar.');
assert.match(pending, /#check-access, #pending-signout, #pending-profile-form button\[type="submit"\]/, 'Todos os disparadores concorrentes precisam participar do busy state.');
assert.match(pending, /actionRegion\?\.setAttribute\('aria-busy', 'true'\)/, 'Gate de acesso precisa anunciar estado ocupado.');
assert.match(pending, /if \(button\.disabled \|\| actionInFlight\) return;/, 'Verificação e saída não podem iniciar durante outra ação.');
assert.match(pending, /if \(actionInFlight \|\| !canSubmitForm\(form, button\)\)/, 'Salvamento do vínculo não pode iniciar durante outra ação.');
assert.match(pending, /finally \{[\s\S]*actionInFlight = false;[\s\S]*setPendingActionsBusy\(button, false\);/, 'Lock e busy state da conta pendente precisam ser restaurados mesmo em erro.');
assert.match(pending, /data-pending-summary="full_name"/, 'Resumo da conta pendente precisa ter alvos atualizáveis.');
assert.match(pending, /function syncPendingSummary/, 'Resumo da conta pendente precisa ser sincronizado sem depender de recarga da rota.');
assert.match(pending, /setState\(\{ profile, context \}\);\s*syncPendingSummary\(profile\);/, 'Verificar aprovação e salvar vínculo precisam atualizar imediatamente o resumo visível.');

console.log('Contrato da conta pendente OK: verificar, sair e salvar vínculo são serializados e o resumo acompanha o perfil atual.');
