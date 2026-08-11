import type { Executive } from '../types';
import {
  validateCPF,
  validateCEP,
  validateEmailFormat,
  validateFullNameTwoWords,
  phoneDigitsMin,
} from './brValidators';

export type ExecutiveProfileFieldErrors = Partial<
  Record<
    | 'fullName'
    | 'cpf'
    | 'rg'
    | 'rgIssuer'
    | 'rgIssueDate'
    | 'birthDate'
    | 'nationality'
    | 'civilStatus'
    | 'workPhone'
    | 'zipCode'
    | 'street'
    | 'number'
    | 'neighborhood'
    | 'city'
    | 'state'
    | 'jobTitle'
    | 'bankCode'
    | 'bankAgency'
    | 'bankAccount'
    | 'personalEmail',
    string
  >
>;

export function validateExecutiveProfileCompletion(
  executive: Partial<Executive>,
  bank: { code: string; agency: string; account: string },
): ExecutiveProfileFieldErrors {
  const errors: ExecutiveProfileFieldErrors = {};
  if (!executive.fullName?.trim()) {
    errors.fullName = 'O nome completo é obrigatório.';
  } else if (!validateFullNameTwoWords(executive.fullName)) {
    errors.fullName = 'O nome completo deve conter pelo menos dois nomes.';
  }
  if (!executive.cpf?.trim()) errors.cpf = 'CPF é obrigatório.';
  else if (!validateCPF(executive.cpf)) errors.cpf = 'CPF inválido.';
  if (!executive.rg?.trim()) errors.rg = 'RG é obrigatório.';
  if (!executive.rgIssuer?.trim()) errors.rgIssuer = 'Órgão emissor do RG é obrigatório.';
  if (!executive.rgIssueDate?.trim()) errors.rgIssueDate = 'Data de expedição do RG é obrigatória.';
  if (!executive.birthDate?.trim()) errors.birthDate = 'Data de nascimento é obrigatória.';
  if (!executive.nationality?.trim()) errors.nationality = 'Nacionalidade é obrigatória.';
  if (!executive.civilStatus?.trim()) errors.civilStatus = 'Estado civil é obrigatório.';
  if (!executive.workPhone?.trim() || !phoneDigitsMin(executive.workPhone)) {
    errors.workPhone = 'Telefone corporativo é obrigatório.';
  }
  if (!validateCEP(executive.zipCode || '')) errors.zipCode = 'CEP é obrigatório e deve ter 8 dígitos.';
  if (!executive.street?.trim()) errors.street = 'Logradouro é obrigatório (informe um CEP válido).';
  if (!executive.number?.trim()) errors.number = 'Número é obrigatório.';
  if (!executive.neighborhood?.trim()) errors.neighborhood = 'Bairro é obrigatório.';
  if (!executive.city?.trim()) errors.city = 'Cidade é obrigatória.';
  if (!executive.state?.trim()) errors.state = 'UF é obrigatória.';
  if (!executive.jobTitle?.trim()) errors.jobTitle = 'Cargo é obrigatório.';
  if (!bank.code?.trim()) errors.bankCode = 'Selecione o banco.';
  if (!bank.agency?.trim()) errors.bankAgency = 'Agência é obrigatória.';
  if (!bank.account?.trim()) errors.bankAccount = 'Conta é obrigatória.';
  if (executive.personalEmail?.trim() && !validateEmailFormat(executive.personalEmail)) {
    errors.personalEmail = 'Informe um e-mail adicional válido.';
  }
  return errors;
}

export function composeBankInfo(code: string, agency: string, account: string): string {
  const label = code.trim();
  const ag = agency.trim();
  const acc = account.trim();
  return `Banco ${label} | Ag ${ag} | Cc ${acc}`.slice(0, 100);
}

/** Extrai code/agency/account do formato gerado por `composeBankInfo`; senão retorna vazios. */
export function parseBankInfo(bankInfo?: string | null): {
  code: string;
  agency: string;
  account: string;
} {
  const raw = (bankInfo ?? '').trim();
  const m = raw.match(/^Banco\s+(.+?)\s*\|\s*Ag\s+(.+?)\s*\|\s*Cc\s+(.+)$/i);
  if (!m) return { code: '', agency: '', account: '' };
  return { code: m[1].trim(), agency: m[2].trim(), account: m[3].trim() };
}
