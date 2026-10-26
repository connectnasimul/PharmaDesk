import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Page } from '../components/ui';
import { ReportSheet } from '../components/PrintHost';
import { DataTable } from '../components/DataTable';
import { daysToExpiry } from '../lib/stock';
import { cn, downloadExcel, downloadFile, toCSV } from '../lib/utils';

type Fmt = 'text' | 'money' | 'num' | 'date';
interface Col { h: string; f: Fmt; right?: boolean }
interface Report { cols: Col[]; rows: (string | number)[][]; foot?: string }

const TABS = ['sales', 'profit', 'stock', 'expiry', 'low', 'vat', 'dues'] as const;
type Tab = (typeof TABS)[number];

export default function Reports() {
  const { t, money, num, date } = useApp();
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const toast = useUI((s) => s.toast);
  const print = useUI((s) => s.print);
  const [tab, setTab] = useState<Tab>('sales');
  const [days, setDays] = useState(30);

  const report: Report = useMemo(() => {
    const cutoff = Date.now() - days * 86400000;
    const valid = orders.filter((o) => o.status !== 'Cancelled' && new Date(o.date).getTime() >= cutoff);
    const cost = (o: (typeof orders)[number]) => o.items.reduce((c, i) => c + i.cost * i.qty, 0);

    switch (tab) {
      case 'sales':
        return {
          cols: [{ h: t('col.orderId'), f: 'text' }, { h: t('col.date'), f: 'date' }, { h: t('col.customer'), f: 'text' }, { h: t('col.total'), f: 'money', right: true }, { h: t('col.method'), f: 'text' }],
          rows: valid.map((o) => [o.id, o.date, o.customerName, o.total, o.method]),
          foot: `${t('col.total')}: ${money(valid.reduce((s, o) => s + o.total, 0))}`,
        };
      case 'profit': {
        const m = new Map<string, { rev: number; cost: number }>();
        valid.forEach((o) => {
          const k = o.date.slice(0, 10);
          const c = m.get(k) ?? { rev: 0, cost: 0 };
          c.rev += o.total;
          c.cost += cost(o);
          m.set(k, c);
        });
        const rows = [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([d, v]) => [d, v.rev, v.cost, v.rev - v.cost]);
        return {
          cols: [{ h: t('col.date'), f: 'date' }, { h: t('sales.revenue'), f: 'money', right: true }, { h: t('sales.cost'), f: 'money', right: true }, { h: t('kpi.profit'), f: 'money', right: true }],
          rows,
          foot: `${t('kpi.profit')}: ${money(rows.reduce((s, r) => s + (r[3] as number), 0))}`,
        };
      }
      case 'stock': {
        const rows = products.map((p) => [p.name + ' ' + p.strength, p.category, p.qty, p.cost, p.qty * p.cost, p.qty * p.price]);
        return {
          cols: [{ h: t('col.product'), f: 'text' }, { h: t('col.category'), f: 'text' }, { h: t('col.qty'), f: 'num', right: true }, { h: t('f.cost'), f: 'money', right: true }, { h: t('rep.costValue'), f: 'money', right: true }, { h: t('rep.saleValue'), f: 'money', right: true }],
          rows,
          foot: `${t('rep.costValue')}: ${money(rows.reduce((s, r) => s + (r[4] as number), 0))} · ${t('rep.saleValue')}: ${money(rows.reduce((s, r) => s + (r[5] as number), 0))}`,
        };
      }
      case 'expiry':
        return {
          cols: [{ h: t('col.product'), f: 'text' }, { h: t('f.batch'), f: 'text' }, { h: t('col.qty'), f: 'num', right: true }, { h: t('col.expiry'), f: 'date' }, { h: t('daysLeft'), f: 'num', right: true }],
          rows: products.filter((p) => daysToExpiry(p.expiry) <= 90).sort((a, b) => a.expiry.localeCompare(b.expiry)).map((p) => [p.name + ' ' + p.strength, p.batch, p.qty, p.expiry, daysToExpiry(p.expiry)]),
        };
      case 'low':
        return {
          cols: [{ h: t('col.product'), f: 'text' }, { h: t('f.generic'), f: 'text' }, { h: t('col.qty'), f: 'num', right: true }, { h: t('f.reorder'), f: 'num', right: true }, { h: t('rep.suggest'), f: 'num', right: true }],
          rows: products.filter((p) => p.qty <= p.reorder).sort((a, b) => a.qty - b.qty).map((p) => [p.name + ' ' + p.strength, p.generic, p.qty, p.reorder, Math.max(0, p.reorder * 3 - p.qty)]),
        };
      case 'vat':
        return {
          cols: [{ h: t('col.orderId'), f: 'text' }, { h: t('col.date'), f: 'date' }, { h: t('subtotal'), f: 'money', right: true }, { h: t('vat'), f: 'money', right: true }, { h: t('col.total'), f: 'money', right: true }],
          rows: valid.map((o) => [o.id, o.date, o.subtotal - o.discount, o.vat, o.total]),
          foot: `${t('vat')} (${num(settings.vat)}%): ${money(valid.reduce((s, o) => s + o.vat, 0))}`,
        };
      case 'dues':
        return {
          cols: [{ h: t('col.orderId'), f: 'text' }, { h: t('col.customer'), f: 'text' }, { h: t('col.date'), f: 'date' }, { h: t('col.total'), f: 'money', right: true }, { h: t('s.Due'), f: 'money', right: true }],
          rows: orders.filter((o) => o.payStatus === 'Due').map((o) => [o.id, o.customerName, o.date, o.total, o.total - o.paid]),
          foot: `${t('s.Due')}: ${money(orders.filter((o) => o.payStatus === 'Due').reduce((s, o) => s + o.total - o.paid, 0))}`,
        };
    }
  }, [tab, days, orders, products, settings.vat, t, money, num]);

  const show = (v: string | number, f: Fmt) => (f === 'money' ? money(Number(v)) : f === 'num' ? num(Number(v)) : f === 'date' ? date(String(v)) : String(v));
  const usesRange = tab === 'sales' || tab === 'profit' || tab === 'vat';

  const exportCsv = () => {
    downloadFile(`report-${tab}.csv`, toCSV([report.cols.map((c) => c.h), ...report.rows]), 'text/csv');
    toast(t('toast.exported'));
  };

  const exportExcel = () => {
    downloadExcel(`report-${tab}`, [report.cols.map((c) => c.h), ...report.rows]);
    toast(t('toast.exported'));
  };

  const printReport = () =>
    print({
      page: 'A4',
      node: (
        <ReportSheet
          title={`${settings.pharmacy.name} — ${t('rep.' + tab)}`}
          subtitle={`${date(new Date().toISOString())}${usesRange ? ` · ${t('last')} ${num(days)} ${t('days')}` : ''}`}
          headers={report.cols.map((c) => c.h)}
          rows={report.rows.map((r) => r.map((v, i) => show(v, report.cols[i].f)))}
          foot={report.foot}
          right={report.cols.map((c) => !!c.right)}
        />
      ),
    });

  return (
    <Page>
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
            {TABS.map((k) => (
              <button key={k} onClick={() => setTab(k)} className={cn('shrink-0 rounded-full px-4 py-2 text-xs font-medium transition', tab === k ? 'bg-brand-800 text-white' : 'bg-soft hover:bg-line')}>
                {t('rep.' + k)}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {usesRange && (
              <select className="field h-10 w-40" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('rep.range')}>
                {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{t('last')} {num(d)} {t('days')}</option>)}
              </select>
            )}
            <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> CSV</button>
            <button className="btn-ghost" onClick={exportExcel}><Download size={16} /> Excel</button>
            <button className="btn-ghost" onClick={printReport}><Printer size={16} /> {t('print')}</button>
          </div>
        </div>

        <DataTable
          rows={report.rows}
          rowKey={(r) => r.join('|')}
          initialPageSize={10}
          empty={<div className="py-12 text-center text-sm text-muted">{t('rep.empty')}</div>}
          columns={report.cols.map((c, i) => ({
            key: String(i),
            header: c.h,
            align: c.right ? ('right' as const) : ('left' as const),
            render: (r: (string | number)[]) => show(r[i], c.f),
          }))}
        />
        {report.foot && <div className="mt-4 rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">{report.foot}</div>}
      </section>
    </Page>
  );
}
