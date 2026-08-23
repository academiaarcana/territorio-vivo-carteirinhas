import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('src/pages/auth.js', 'utf8');

assert.match(auth, /const PASSWORD_MIN_LENGTH = 8;/, 'Frontend precisa manter o mínimo de oito caracteres.');
assert.ok(auth.includes('const PASSWORD_REQUIREMENT = `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;'), 'Mensagem precisa explicar somente o tamanho mínimo.');
assert.match(auth, /Não é obrigatório misturar letras maiúsculas, números e símbolos\./, 'Cadastro e recuperação precisam explicar a política simples.');
assert.doesNotMatch(auth, /const PASSWORD_SYMBOLS = /, 'Frontend não deve impor uma lista obrigatória de símbolos.');
assert.doesNotMatch(auth, /hasRequiredCharacters/, 'Frontend não deve impor regras de composição.');
assert.match(auth, /function validatePassword[\s\S]*value\.length < PASSWORD_MIN_LENGTH[\s\S]*return PASSWORD_REQUIREMENT;[\s\S]*return '';/, 'Validação deve rejeitar somente senhas curtas.');
assert.match(auth, /weak_password[\s\S]*return PASSWORD_REQUIREMENT;/, 'Erro do Supabase precisa informar a mesma política exibida no formulário.');
assert.match(auth, /Crie sua senha/, 'Cadastro e recuperação precisam orientar antes dos campos de senha.');
assert.match(auth, /não reutilize a senha de outro serviço\./, 'Orientação precisa incentivar uma senha exclusiva.');
assert.match(auth, /passwordGuidance\('signup-password-help'\)[\s\S]*name="password"/, 'Cadastro precisa mostrar a orientação antes do campo de senha.');
assert.match(auth, /name="password2"[^>]+aria-describedby="signup-password-help"/, 'Confirmação de senha precisa apontar para a mesma orientação.');
assert.match(auth, /passwordGuidance\('recovery-password-help'\)[\s\S]*Nova senha/, 'Recuperação precisa mostrar a orientação antes da nova senha.');

console.log('Contrato da política de senha OK: frontend exige somente o mínimo de oito caracteres.');
