import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('src/pages/auth.js', 'utf8');

assert.match(auth, /const PASSWORD_MIN_LENGTH = 10;/, 'Frontend precisa manter o mínimo de dez caracteres.');
assert.match(auth, /const PASSWORD_SYMBOLS = /, 'Política precisa declarar os símbolos aceitos pelo Supabase.');
assert.match(auth, /letra minúscula, letra maiúscula, número e símbolo/, 'Cadastro e recuperação precisam explicar a política completa.');
assert.match(auth, /\[a-z\]/, 'Validação precisa exigir letra minúscula.');
assert.match(auth, /\[A-Z\]/, 'Validação precisa exigir letra maiúscula.');
assert.match(auth, /\\d/, 'Validação precisa exigir número.');
assert.match(auth, /PASSWORD_SYMBOLS\.includes\(character\)/, 'Validação precisa exigir símbolo aceito pelo Supabase.');
assert.match(auth, /weak_password[\s\S]*return PASSWORD_REQUIREMENT;/, 'Erro do Supabase precisa informar a mesma política exibida no formulário.');

console.log('Contrato da política de senha OK: frontend exige minúscula, maiúscula, número e símbolo.');
