import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { code128Svg } from '../lib/code128';
import { useUI } from '../store/ui';
import type { Product } from '../types';

/** Renders any queued print job into #print-root and opens the browser print dialog. */
export function PrintHost() {
  const job = useUI((s) => s.printJob);
  const clear = useUI((s) => s.clearPrint);
  const host = typeof document !== 'undefined' ? document.getElementById('print-root') : null;

  useEffect(() => {
    if (!job) return;
    const done = () => clear();
    window.addEventListener('afterprint', done, { once: true });
    const id = setTimeout(() => window.print(), 250);
    return () => {
      clearTimeout(id);
      window.removeEventListener('afterprint', done);
    };
  }, [job, clear]);

  if (!job || !host) return null;
  return createPortal(
    <div>
      <style>{`@page { size: ${job.page}; margin: ${job.page.startsWith('A4') ? '12mm' : '3mm'}; }`}</style>
      {job.node}
    </div>,
    host
  );
}

/** Printable table for reports (A4). */
export function ReportSheet({ title, subtitle, headers, rows, foot, right }: { title: string; subtitle: string; headers: string[]; rows: string[][]; foot?: string; right: boolean[] }) {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Hind Siliguri',sans-serif", color: '#000', fontSize: 12 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>{title}</h1>
      <div style={{ color: '#555', marginBottom: 12 }}>{subtitle}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: right[i] ? 'right' : 'left', borderBottom: '2px solid #000', padding: '4px 6px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} style={{ pageBreakInside: 'avoid' }}>
              {r.map((c, i) => (
                <td key={i} style={{ textAlign: right[i] ? 'right' : 'left', borderBottom: '1px solid #ccc', padding: '4px 6px' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {foot && <div style={{ marginTop: 12, fontWeight: 700 }}>{foot}</div>}
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const { width, height, bars } = code128Svg(value, 40);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '9mm', display: 'block' }} role="img" aria-label={value}>
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000" />)}
    </svg>
  );
}

/** Builds the label sheet (Code 128 barcode, 50 x 30 mm style labels). */
export async function buildLabels(products: Product[], copies: number, money: (n: number) => string, shop: string) {
  const items = products.flatMap((p) => Array.from({ length: copies }, () => p));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm', fontFamily: "'Plus Jakarta Sans','Hind Siliguri',sans-serif", color: '#000' }}>
      {items.map((p, k) => (
        <div key={k} style={{ width: '48mm', height: '28mm', border: '0.3mm solid #000', borderRadius: '1.5mm', padding: '1.5mm 2mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', pageBreakInside: 'avoid' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1mm', alignItems: 'baseline' }}>
            <div style={{ fontSize: '2.8mm', fontWeight: 800, lineHeight: 1.1, minWidth: 0 }}>{p.name} {p.strength}</div>
            <div style={{ fontSize: '3.6mm', fontWeight: 800, whiteSpace: 'nowrap' }}>{money(p.price)}</div>
          </div>
          <div style={{ fontSize: '2mm', color: '#444' }}>{p.generic} · {shop}</div>
          <div>
            <Barcode value={p.barcode || p.id} />
            <div style={{ fontSize: '2mm', textAlign: 'center', letterSpacing: '0.3mm' }}>{p.barcode || p.id}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
