/** Validadores e máscaras BR compartilhados (CNPJ, CPF, CEP). */

export function normalizeDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function validateCNPJ(cnpj: string): boolean {
  const cnpjClean = normalizeDigits(cnpj);
  if (cnpjClean.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpjClean)) return false;

  let size = cnpjClean.length - 2;
  let numbers = cnpjClean.substring(0, size);
  const digits = cnpjClean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  size += 1;
  numbers = cnpjClean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}

export const maskCNPJ = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export function validateCEP(cep: string): boolean {
  return normalizeDigits(cep).length === 8;
}

export const maskCEP = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export function validateCPF(cpf: string): boolean {
  const cpfClean = normalizeDigits(cpf);
  if (cpfClean.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpfClean)) return false;

  for (let j = 0; j < 2; j++) {
    let sum = 0;
    for (let i = 0; i < 9 + j; i++) {
      sum += parseInt(cpfClean.charAt(i), 10) * (10 + j - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpfClean.charAt(9 + j), 10)) return false;
  }
  return true;
}

export const maskCPF = (value: string): string => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailFormat(email: string): boolean {
  const trimmed = (email || '').trim();
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_RE.test(trimmed);
}
