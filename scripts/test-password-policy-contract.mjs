import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('src/pages/auth.js', 'utf8');
const structural = fs.readFileSync('src/styles/structural.css', 'utf8');

assert.match(auth, /const PASSWORD_MIN_LENGTH = 8;/, 'Frontend precisa manter o mínimo de oito caracteres.');
assert.ok(auth.includes('const PASSWORD_REQUIREMENT = `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;'), 'Mensagem precisa explicar somente o tamanho mínimo.');
assert.match(auth, /Não é obrigatório misturar letras maiúsculas, números e símbolos\./, 'Cadastro e recuperação precisam explicar a política simples.');
assert.doesNotMatch(auth, /const PASSWORD_SYMBOLS = /, 'Frontend não deve impor uma lista obrigatória de símbolos.');
assert.doesNotMatch(auth, /hasRequiredCharacters/, 'Frontend não deve impor regras de composição.');
assert.match(auth, /function validatePassword[\s\S]*value\.length < PASSWORD_MIN_LENGTH[\s\S]*return PASSWORD_REQUIREMENT;[\s\S]*return '';/, 'Validação deve rejeitar somente senhas curtas.');
assert.match(auth, /function weakPasswordMessage[\s\S]*reasons\.includes\('pwned'\)[\s\S]*PASSWORD_LEAKED_MESSAGE/, 'Senha vazada precisa receber uma orientação específica.');
assert.match(auth, /serverMinimum[\s\S]*Use pelo menos \$\{serverMinimum\} caracteres\./, 'Mínimo informado pelo servidor precisa ser exibido sem substituir por um número incorreto.');
assert.match(auth, /reasons\.includes\('length'\)[\s\S]*PASSWORD_REQUIREMENT/, 'Rejeição por tamanho precisa manter a mensagem de oito caracteres.');
assert.match(auth, /reasons\.includes\('characters'\)[\s\S]*PASSWORD_CHARACTERS_MESSAGE/, 'Rejeição por composição precisa explicar que há requisitos de segurança adicionais.');
assert.match(auth, /weak_password[\s\S]*return weakPasswordMessage\(error\);/, 'Erro de senha fraca precisa respeitar o motivo devolvido pelo Supabase.');
assert.match(auth, /Crie sua senha/, 'Cadastro e recuperação precisam orientar antes dos campos de senha.');
assert.match(auth, /não reutilize a senha de outro serviço\./, 'Orientação precisa incentivar uma senha exclusiva.');
assert.match(auth, /passwordGuidance\('signup-password-help'\)[\s\S]*passwordField\(\{ id: 'signup-password'/, 'Cadastro precisa mostrar a orientação antes do campo de senha.');
assert.match(auth, /id: 'signup-password-confirmation'[\s\S]*name: 'password2'[\s\S]*describedBy: 'signup-password-help'/, 'Confirmação de senha precisa apontar para a mesma orientação.');
assert.match(auth, /passwordGuidance\('recovery-password-help'\)[\s\S]*Nova senha/, 'Recuperação precisa mostrar a orientação antes da nova senha.');
assert.match(auth, /data-password-toggle[\s\S]*aria-label="Mostrar senha"[\s\S]*aria-pressed="false"/, 'Controle de visibilidade precisa iniciar com nome e estado acessíveis.');
assert.match(auth, /input\.type = showing \? 'text' : 'password'/, 'Controle precisa alternar o tipo do campo sem alterar seu valor.');
assert.match(auth, /button\.setAttribute\('aria-pressed', String\(showing\)\)/, 'Controle precisa comunicar seu estado a tecnologias assistivas.');
assert.match(auth, /id: 'login-password'[\s\S]*id: 'signup-password'[\s\S]*id: 'recovery-password'/, 'Visualização de senha precisa existir em login, cadastro e recuperação.');
assert.match(structural, /\.password-control\{position:relative\}/, 'Campo de senha precisa ancorar o controle visual.');
assert.match(structural, /\.password-toggle\{[^}]*min-height:42px/, 'Controle de senha precisa manter alvo de toque acessível.');

console.log('Contrato da senha OK: mínimo de oito caracteres, mensagens corretas e visualização acessível.');
