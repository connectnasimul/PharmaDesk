import clsx, { type ClassValue } from 'clsx';

export const cn = (...v: ClassValue[]) => clsx(v);

export function downloadFile(name: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function toCSV(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // BOM so Excel opens Bangla text correctly
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
}

export const uid = (prefix = '') => prefix + Math.random().toString(36).slice(2, 8).toUpperCase();

/** Excel-compatible export (HTML table saved as .xls, UTF-8 so Bangla text is kept). Opens directly in Excel / Google Sheets. */
export function downloadExcel(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cell = (v: string | number, head: boolean) =>
    head ? `<th style="background:#0B4A41;color:#fff">${esc(v)}</th>` : typeof v === 'number' ? `<td x:num="${v}">${v}</td>` : `<td style="mso-number-format:'\\@'">${esc(v)}</td>`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">${rows
    .map((r, i) => `<tr>${r.map((v) => cell(v, i === 0)).join('')}</tr>`)
    .join('')}</table></body></html>`;
  downloadFile(name.replace(/\.xls$/, '') + '.xls', '\ufeff' + html, 'application/vnd.ms-excel');
}
