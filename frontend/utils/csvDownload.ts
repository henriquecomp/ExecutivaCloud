type CsvRow = Record<string, string | number | boolean | null | undefined>;

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(headers: string[], rows: CsvRow[], filename: string): void {
  const headerLine = headers.map(escapeField).join(',');
  const keys = Object.keys(rows[0] ?? {});
  const dataLines = rows.map((row) =>
    keys.map((k) => escapeField(String(row[k] ?? ''))).join(','),
  );
  const csv = [headerLine, ...dataLines].join('\r\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
