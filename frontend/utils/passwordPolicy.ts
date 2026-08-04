export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

const COMMON_PASSWORDS = new Set(
  [
    '12345678',
    '123456789',
    '1234567890',
    'password',
    'password1',
    'password123',
    'senha123',
    'senha1234',
    'qwerty123',
    'qwertyui',
    'abc12345',
    'admin123',
    'letmein1',
    'welcome1',
    'iloveyou',
    'sunshine',
    'princess',
    'football',
    'baseball',
    'dragon12',
    'master12',
    'monkey12',
    'shadow12',
    'trustno1',
    'batman12',
    'superman',
    'starwars',
    'whatever',
    'passw0rd',
    'p@ssw0rd',
    'changeme',
    'executiva',
    'executiva1',
    'executiva123',
    'hmr12345',
    'administrador',
    'brasil123',
    'flamengo',
    'corinthians',
    'palmeiras',
    'santos123',
    'gremio123',
    'vasco1234',
    'botafogo',
    'familia123',
    'amor1234',
    'felicidade',
    'computador',
    'internet',
    'seguranca',
    'minhasenha',
    'minhasenha1',
    'meusenha1',
    'usuario1',
    'usuario123',
    'cliente123',
    'empresa123',
    'acesso123',
    'sistema123',
    'cadastro1',
    'cadastro123',
    '11111111',
    '00000000',
    '87654321',
    '987654321',
    'asdfghjk',
    'zxcvbnm1',
    'qazwsxedc',
    '1q2w3e4r',
    '1qaz2wsx',
    'aa123456',
    'abc123456',
    'teste123',
    'teste1234',
    'test1234',
    'demo1234',
    'guest123',
    'welcome123',
    'hello123',
    'access123',
    'login1234',
    'senha@123',
    'p@ssw0rd',
    'password1',
    'password123',
    'admin1234',
    'qwerty123',
    'brasil123',
    'santos123',
    'flamengo1',
    'corinthians',
    'palmeiras',
    'gremio123',
    'vasco1234',
    'familia123',
    'amor12345',
    'felicidade',
    'computador',
    'internet1',
    'seguranca',
    'minhasenha',
    'meusenha1',
    'usuario123',
    'cliente123',
    'empresa123',
    'acesso123',
    'sistema123',
    'cadastro123',
  ].map((p) => p.toLowerCase()),
);

const OBVIOUS_SEQUENCES = [
  '0123456789',
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

function isObviousPattern(password: string): boolean {
  if (/^(.)\1+$/.test(password)) return true;
  const lower = password.toLowerCase();
  return OBVIOUS_SEQUENCES.some((seq) => {
    if (lower.length < 4) return false;
    return seq.includes(lower) || seq.split('').reverse().join('').includes(lower);
  });
}

function charsetVariety(password: string): number {
  let count = 0;
  if (/[a-z]/.test(password)) count += 1;
  if (/[A-Z]/.test(password)) count += 1;
  if (/\d/.test(password)) count += 1;
  if (/[^a-zA-Z0-9]/.test(password)) count += 1;
  return count;
}

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'A senha deve ter no máximo 64 caracteres.';
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Esta senha é muito comum. Escolha outra.';
  }
  return null;
}

export function isPasswordPolicyValid(password: string): boolean {
  return getPasswordPolicyError(password) === null;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  if (!isPasswordPolicyValid(password) || password.length < 10 || isObviousPattern(password)) {
    return 'weak';
  }
  if (password.length >= 12 && charsetVariety(password) >= 2) {
    return 'strong';
  }
  return 'medium';
}

export const PASSWORD_HELP_ITEMS = [
  'Use entre 8 e 64 caracteres.',
  'Prefira uma frase longa ou use um gerenciador de senhas.',
  'Evite senhas comuns ou fáceis de adivinhar.',
  'Não é necessário incluir símbolos, números ou letras maiúsculas.',
];

export const PASSWORD_STRENGTH_LABEL: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'Senha fraca',
  medium: 'Senha média',
  strong: 'Senha forte',
};

export const PASSWORD_STRENGTH_BAR_CLASS: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'bg-red-500',
  medium: 'bg-amber-500',
  strong: 'bg-green-500',
};

export const PASSWORD_STRENGTH_WIDTH: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'w-1/3',
  medium: 'w-2/3',
  strong: 'w-full',
};
