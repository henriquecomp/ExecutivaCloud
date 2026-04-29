/** Valor para atributo `min` / `value` de `<input type="datetime-local" />` no fuso local. */
export function toDatetimeLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayDateInputValue(): string {
  return new Date().toISOString().split('T')[0];
}
