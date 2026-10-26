import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Printer } from 'lucide-react';
import type { Order, Paper, Settings } from '../types';
import { amountInWords } from '../lib/format';
import { useApp } from '../hooks/useApp';
import { Modal } from './ui';

const PAPER_CSS: Record<Paper, { width: string; font: number; page: string }> = {
  '58mm': { width: '54mm', font: 10, page: '58mm auto' },
  '80mm': { width: '74mm', font: 11, page: '80mm auto' },
  A4: { width: '190mm', font: 13, page: 'A4' },
};

/** The printable receipt / invoice. Pure presentational: used in the preview and in the print portal. */
export function Receipt({ order, settings, scale = 1 }: { order: Order; settings: Settings; scale?: number }) {
  const { money, num, date, time, t } = useApp();
  const [qr, setQr] = useState('');
  const cfg = PAPER_CSS[settings.paper];
  const p = settings.pharmacy;
  const isA4 = settings.paper === 'A4';

  useEffect(() => {
    if (!settings.showQr) return;
    QRCode.toDataURL(order.invoiceNo, { margin: 0, width: 160 }).then(setQr).catch(() => setQr(''));
  }, [order.invoiceNo, settings.showQr]);

  const dashed = '1px dashed #888';
  const row = { display: 'flex', justifyContent: 'space-between', gap: 8 } as const;
  const due = Math.max(0, order.total - order.paid);

  return (
    <div
      style={{
        width: cfg.width,
        fontSize: cfg.font * scale,
        color: '#000',
        background: '#fff',
        fontFamily: isA4 ? "'Plus Jakarta Sans','Hind Siliguri',sans-serif" : "'Courier New','Hind Siliguri',monospace",
        lineHeight: 1.35,
        padding: isA4 ? 0 : '2mm 0',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 800, fontSize: (cfg.font + (isA4 ? 6 : 3)) * scale }}>{p.name}</div>
        <div>{p.address}</div>
        <div>{t('r.tel')}: {p.phone}</div>
        <div>{t('r.license')}: {p.license} · BIN: {p.bin}</div>
      </div>

      <div style={{ borderTop: dashed, borderBottom: dashed, padding: '4px 0', margin: '4px 0' }}>
        <div style={row}><span>{t('r.invoice')}</span><b>{order.invoiceNo}</b></div>
        <div style={row}><span>{t('r.date')}</span><span>{date(order.date)} {time(order.date)}</span></div>
        <div style={row}><span>{t('r.cashier')}</span><span>{order.cashier}</span></div>
        <div style={row}><span>{t('r.customer')}</span><span>{order.customerName}</span></div>
        {order.doctor && <div style={row}><span>{t('r.doctor')}</span><span>{order.doctor}</span></div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: dashed, textAlign: 'left' }}>
            <th style={{ padding: '2px 0' }}>{t('r.item')}</th>
            <th style={{ textAlign: 'center' }}>{t('r.qty')}</th>
            <th style={{ textAlign: 'right' }}>{t('r.rate')}</th>
            <th style={{ textAlign: 'right' }}>{t('r.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={idx} style={{ verticalAlign: 'top' }}>
              <td style={{ padding: '2px 4px 2px 0' }}>{i.name} {i.strength}</td>
              <td style={{ textAlign: 'center' }}>{num(i.qty)}</td>
              <td style={{ textAlign: 'right' }}>{money(i.price)}</td>
              <td style={{ textAlign: 'right' }}>{money(i.qty * i.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: dashed, marginTop: 4, paddingTop: 4 }}>
        <div style={row}><span>{t('subtotal')}</span><span>{money(order.subtotal)}</span></div>
        {order.discount > 0 && <div style={row}><span>{t('discount')}</span><span>− {money(order.discount)}</span></div>}
        {order.vat > 0 && <div style={row}><span>{t('vat')}</span><span>{money(order.vat)}</span></div>}
        <div style={{ ...row, fontWeight: 800, fontSize: (cfg.font + 3) * scale, borderTop: dashed, borderBottom: dashed, margin: '4px 0', padding: '3px 0' }}>
          <span>{t('r.grand')}</span><span>{money(order.total)}</span>
        </div>
        <div style={row}><span>{t('r.paid')} ({order.method})</span><span>{money(order.paid)}</span></div>
        {due > 0 && <div style={{ ...row, fontWeight: 700 }}><span>{t('r.due')}</span><span>{money(due)}</span></div>}
        {order.paid > order.total && <div style={row}><span>{t('r.change')}</span><span>{money(order.paid - order.total)}</span></div>}
      </div>

      {settings.showWords && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{amountInWords(order.total)}</div>}

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        {settings.showQr && qr && <img src={qr} alt={order.invoiceNo} style={{ width: isA4 ? '28mm' : '22mm', height: isA4 ? '28mm' : '22mm', margin: '0 auto' }} />}
        {settings.footer.split('\n').map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

/** Opens the browser print dialog for one or more copies of the receipt, using the chosen paper size. */
export function PrintPortal({ order, settings }: { order: Order | null; settings: Settings }) {
  const host = document.getElementById('print-root');
  if (!order || !host) return null;
  const cfg = PAPER_CSS[settings.paper];
  const copies = Math.max(1, settings.copies);
  return createPortal(
    <div>
      <style>{`@page { size: ${cfg.page}; margin: ${settings.paper === 'A4' ? '10mm' : '0'}; }`}</style>
      {Array.from({ length: copies }).map((_, i) => (
        <div key={i} style={{ pageBreakAfter: i < copies - 1 ? 'always' : 'auto' }}>
          <Receipt order={order} settings={settings} />
        </div>
      ))}
    </div>,
    host
  );
}

export function ReceiptModal({ order, onClose, primaryLabel }: { order: Order | null; onClose: () => void; primaryLabel?: string }) {
  const { t, settings } = useApp();

  const doPrint = () => setTimeout(() => window.print(), 60);

  useEffect(() => {
    if (!order) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        doPrint();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [order]);

  return (
    <>
      <Modal
        open={!!order}
        onClose={onClose}
        title={order ? `${t('r.invoice')} ${order.invoiceNo}` : ''}
        width="max-w-md"
        footer={
          <>
            <button className="btn-ghost" onClick={onClose}>{primaryLabel ?? t('close')}</button>
            <button className="btn-lime" onClick={doPrint}><Printer size={16} /> {t('print')} (F9)</button>
          </>
        }
      >
        {order && (
          <div className="overflow-x-auto rounded-2xl bg-soft p-4">
            <div className="mx-auto w-fit shadow-card" style={settings.paper === 'A4' ? ({ zoom: 0.45 } as CSSProperties) : undefined}>
              <Receipt order={order} settings={settings} />
            </div>
          </div>
        )}
      </Modal>
      {order && <PrintPortal order={order} settings={settings} />}
    </>
  );
}
