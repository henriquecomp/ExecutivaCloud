/** Ordena itens com `name` em ordem alfabética (pt-BR, sem distinguir maiúsculas). */
export function sortByNamePt<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }),
  );
}
