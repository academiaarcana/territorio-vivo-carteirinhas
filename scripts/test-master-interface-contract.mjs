import assert from 'node:assert/strict';
import fs from 'node:fs';

const permissions = fs.readFileSync('src/core/permissions.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
const profile = fs.readFileSync('src/pages/profile.js', 'utf8');
const admin = fs.readFileSync('src/pages/admin.js', 'utf8');
const territory = fs.readFileSync('src/pages/territory.js', 'utf8');
const migration29 = fs.readFileSync('supabase/migrations/029_separate_gestor_and_master_account.sql', 'utf8');
const migration31 = fs.readFileSync('supabase/migrations/031_enforce_management_scope_shape.sql', 'utf8');

assert.match(permissions, /isMasterAccount/, 'Frontend precisa distinguir a conta técnica Master dos gestores role=admin.');
assert.match(permissions, /return 'Master \/ Desenvolvimento'/, 'Conta técnica deve ter rótulo próprio.');
assert.match(permissions, /return 'Gestor Municipal'/, 'Admin operacional deve ser apresentado como Gestor Municipal.');
assert.match(permissions, /targetProfile\.is_master_account === true/, 'Conta Master não pode ser alvo de alteração comum.');

assert.match(layout, /Master \/ Desenvolvimento • Administração técnica/, 'Shell da conta técnica deve identificá-la explicitamente.');
assert.match(layout, /Gestor Municipal • Administração geral/, 'Shell do gestor deve diferenciá-lo da conta técnica.');
assert.match(layout, /Território Vivo • Gestão municipal/, 'Cabeçalho do gestor deve comunicar gestão municipal.');
assert.match(layout, /masterAccount[\s\S]*workspace-territory-action[\s\S]*data-nav="\/app\/gestao"/, 'Atalho de administração técnica do Master deve ser um controle interativo que abre a gestão da rede.');
assert.match(layout, /aria-label="Abrir administração técnica do Território Vivo"/, 'Atalho de administração técnica deve ter nome acessível explícito.');

assert.match(dashboard, /Painel Gestor/, 'Dashboard precisa ter identidade própria para o Gestor Municipal.');
assert.match(dashboard, /Painel Master/, 'Dashboard precisa preservar identidade separada para a conta técnica.');
assert.match(dashboard, /Toda a rede cadastrada/, 'Gestor e Master continuam com escopo de rede completa.');

assert.match(profile, /Configurações do Gestor Municipal/, 'Perfil do gestor deve ser nomeado como gestão municipal.');
assert.match(profile, /Configurações do Master \/ Desenvolvimento/, 'Perfil técnico deve permanecer distinguível.');

assert.match(admin, /<option value="admin"[^>]*>Gestor Municipal<\/option>/, 'A conta Master deve conseguir atribuir o papel de Gestor Municipal.');
assert.match(admin, /masterAccount \? `<option value="admin"/, 'Opção de Gestor deve existir somente para a conta Master.');
assert.match(admin, /target\.is_master_account === true/, 'Conta Master deve permanecer protegida na gestão de perfis.');
assert.match(admin, /target\.role !== 'admin'/, 'Gestor Municipal não deve editar outra conta admin.');
assert.match(admin, /if \(roleChanged && gestorScope\) await setProfileRole\(id, requestedRole\);/, 'Promoção a Gestor deve ocorrer antes de remover vínculo obrigatório de perfil profissional.');
assert.match(admin, /unit_cnes: gestorScope \? null : unitCnes/, 'Gestor Municipal não deve manter vínculo de UBS herdado do cadastro.');
assert.match(admin, /team_name: managedTeam\?\.name \|\| ''/, 'Ao remover equipe, o rótulo antigo não pode permanecer como equipe a confirmar.');

assert.match(migration29, /is_master_account boolean not null default false/, 'Banco precisa registrar a distinção Master sem criar quarto role.');
assert.match(migration29, /private\.is_master_account\(\)/, 'Banco precisa centralizar a identificação da conta Master.');
assert.match(migration29, /caller_is_master and new\.role in \('acs', 'unit_admin', 'admin'\)/, 'Somente Master pode promover um perfil a Gestor Municipal.');
assert.match(migration29, /private\.is_admin\(\) and role <> 'admin'/, 'RLS deve impedir um gestor de alterar outro admin.');
assert.match(migration29, /new\.is_master_account := old\.is_master_account/, 'Flag Master deve ser imutável pelo cliente.');

assert.match(migration31, /if new\.role = 'admin' then[\s\S]*new\.unit_cnes := null;[\s\S]*new\.team_id := null;[\s\S]*new\.microarea := '';/, 'Gestor Municipal deve ter escopo de rede, sem UBS, equipe ou microárea herdadas.');
assert.match(migration31, /elsif new\.role = 'unit_admin' then[\s\S]*new\.team_id := null;[\s\S]*new\.microarea := '';/, 'Administrador da UBS deve representar a unidade inteira, sem equipe ou microárea.');
assert.match(migration31, /where role = 'admin'/, 'Migration deve limpar vínculos antigos já gravados em contas admin.');
assert.match(migration31, /where role = 'unit_admin'/, 'Migration deve limpar vínculos antigos já gravados em administradores de UBS.');

assert.match(territory, /Visão geral da rede/, 'Território da gestão de rede não deve ser limitado a uma UBS.');

console.log('Contrato Gestor × Master OK: role admin operacional separado da conta técnica protegida.');
