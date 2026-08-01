/** Principais bancos (código COMPE / BACEN) para cadastro de executivos. */
export const BRAZILIAN_BANKS: { code: string; name: string }[] = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Banco Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú Unibanco' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Banco Inter' },
  { code: '336', name: 'C6 Bank' },
  { code: '422', name: 'Safra' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob' },
  { code: '041', name: 'Banrisul' },
  { code: '212', name: 'Banco Original' },
  { code: '655', name: 'Votorantim' },
  { code: '070', name: 'BRB' },
  { code: '389', name: 'Mercantil do Brasil' },
  { code: '623', name: 'Pan' },
  { code: '290', name: 'PagSeguro' },
  { code: '380', name: 'PicPay' },
  { code: '136', name: 'Unicred' },
];

export function bankLabel(code: string): string {
  const found = BRAZILIAN_BANKS.find((b) => b.code === code);
  return found ? `${found.code} — ${found.name}` : code;
}
