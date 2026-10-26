import type { Product } from '../types';

/** Minimal RFC-4180 style parser (handles quotes, commas and newlines inside quotes, BOM). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

const ALIASES: Record<string, string[]> = {
  name: ['name', 'product', 'product name'],
  strength: ['strength', 'power'],
  generic: ['generic', 'generic name'],
  manufacturer: ['manufacturer', 'company', 'brand'],
  category: ['category'],
  form: ['form', 'type'],
  barcode: ['barcode'],
  batch: ['batch', 'batch no'],
  expiry: ['expiry', 'expiry date', 'exp'],
  qty: ['qty', 'quantity', 'stock'],
  cost: ['cost', 'cost (bdt)', 'purchase price'],
  price: ['price', 'price (bdt)', 'selling price', 'mrp'],
  shelf: ['shelf', 'rack'],
};

/** Convert DD-MM-YYYY or YYYY-MM-DD into YYYY-MM-DD ('' if invalid). */
function normDate(v: string): string {
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

export interface ImportResult {
  products: Product[];
  skipped: number;
}

export function csvToProducts(text: string): ImportResult {
  const rows = parseCSV(text);
  if (rows.length < 2) return { products: [], skipped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.findIndex((h) => ALIASES[k].includes(h));
  const col = Object.fromEntries(Object.keys(ALIASES).map((k) => [k, idx(k)])) as Record<string, number>;
  if (col.name < 0) return { products: [], skipped: rows.length - 1 };
  const get = (r: string[], k: string) => (col[k] >= 0 ? (r[col[k]] ?? '').trim() : '');
  const out: Product[] = [];
  let skipped = 0;
  rows.slice(1).forEach((r) => {
    const price = Number(get(r, 'price'));
    const expiry = normDate(get(r, 'expiry'));
    if (!get(r, 'name') || !(price > 0) || !expiry) { skipped++; return; }
    out.push({
      id: '',
      name: get(r, 'name'),
      strength: get(r, 'strength'),
      generic: get(r, 'generic'),
      manufacturer: get(r, 'manufacturer'),
      category: get(r, 'category') || 'Other',
      form: get(r, 'form') || 'Tablet',
      unit: 'pcs',
      barcode: get(r, 'barcode'),
      batch: get(r, 'batch'),
      expiry,
      cost: Number(get(r, 'cost')) || Math.round(price * 0.75 * 100) / 100,
      price,
      qty: Math.max(0, Math.floor(Number(get(r, 'qty')) || 0)),
      reorder: 20,
      shelf: get(r, 'shelf'),
    });
  });
  return { products: out, skipped };
}
