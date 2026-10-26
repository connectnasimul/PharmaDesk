import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../hooks/useApp';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  pageSizes?: number[];
  initialPageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, rows, rowKey, empty, pageSizes = [5, 10, 20, 50], initialPageSize = 10, onRowClick }: Props<T>) {
  const { t, num } = useApp();
  const [size, setSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  useEffect(() => setPage(1), [rows.length]);

  const slice = useMemo(() => rows.slice((page - 1) * size, page * size), [rows, page, size]);

  // compact page list: 1 2 3 … last
  const pageList = useMemo(() => {
    if (pages <= 6) return Array.from({ length: pages }, (_, i) => i + 1);
    const s = new Set([1, 2, 3, pages, page]);
    if (page > 1) s.add(page - 1);
    if (page < pages) s.add(page + 1);
    const arr = [...s].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    arr.forEach((n, i) => {
      if (i && n - arr[i - 1] > 1) out.push('…');
      out.push(n);
    });
    return out;
  }, [pages, page]);

  return (
    <div>
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[720px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-soft">
              {columns.map((c) => (
                <th key={c.key} className={cn('th', c.align === 'right' && 'text-right', c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('group transition-colors hover:bg-soft/60', onRowClick && 'cursor-pointer')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('td border-b border-line/60 group-last:border-0', c.align === 'right' && 'text-right', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && empty}

      {rows.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted">
          <label className="flex items-center gap-2">
            {t('showing')}
            <span className="relative">
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                className="h-8 appearance-none rounded-lg bg-soft pl-3 pr-7 text-xs text-ink outline-none"
                aria-label={t('rowsPerPage')}
              >
                {pageSizes.map((s) => <option key={s} value={s}>{num(s)}</option>)}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-2.5" />
            </span>
            {t('outOf')} {num(rows.length)}
          </label>
          <div className="flex items-center gap-1">
            <button className="grid h-8 w-8 place-items-center rounded-lg bg-soft disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous"><ChevronLeft size={14} /></button>
            {pageList.map((n, i) =>
              n === '…' ? (
                <span key={'e' + i} className="px-1">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn('grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs transition-colors', n === page ? 'bg-brand-800 text-white' : 'bg-soft text-ink hover:bg-line')}
                >
                  {num(n)}
                </button>
              )
            )}
            <button className="grid h-8 w-8 place-items-center rounded-lg bg-soft disabled:opacity-40" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
