/** Consulta ViaCEP — uso em qualquer formulário com CEP. */

import { normalizeDigits } from './brValidators';

export interface CepAddressFields {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function fetchAddressByCep(cep: string): Promise<CepAddressFields> {
  const cepClean = normalizeDigits(cep);
  if (cepClean.length !== 8) {
    throw new Error('CEP incompleto.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
  if (!response.ok) {
    throw new Error('Erro ao buscar CEP.');
  }

  const data = await response.json();
  if (data.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    street: data.logradouro || '',
    neighborhood: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || '',
  };
}
