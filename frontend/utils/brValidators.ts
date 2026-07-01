/** Validadores e máscaras BR compartilhados (CNPJ, CPF, CEP). */

export function normalizeDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function normalizeCnpjRaw(value: string): string {
  return (value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 14);
}

function cnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function cnpjCheckDigits(base12: string): string {
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += cnpjCharValue(base12[i]) * w1[i];
  }
  const r1 = sum1 % 11;
  const d1 = r1 < 2 ? 0 : 11 - r1;

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const base13 = base12 + String(d1);
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += cnpjCharValue(base13[i]) * w2[i];
  }
  const r2 = sum2 % 11;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return `${d1}${d2}`;
}

export function validateCNPJ(cnpj: string): boolean {
  const normalized = normalizeCnpjRaw(cnpj);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(normalized)) return false;
  if (/^(.)\1{13}$/.test(normalized)) return false;
  return cnpjCheckDigits(normalized.slice(0, 12)) === normalized.slice(12);
}

export const maskCNPJ = (value: string): string => {
  const v = normalizeCnpjRaw(value);
  if (!v) return '';
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
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

export function validateFullNameTwoWords(value: string): boolean {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}
