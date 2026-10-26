import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Filter, Printer, Search, ShoppingCart, Trash2, XCircle, Eye } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp, useDebounced } from '../hooks/useApp';
import { Badge, EmptyState, Page, StatCard, toneOf } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { ReceiptModal } from '../components/Receipt';
import { cn, downloadFile, toCSV } from '../lib/utils';
import type { Order, OrderStatus } from '../types';

const STATUSES: OrderStatus[] = ['Completed', 'In progress', 'Pending', 'Cancelled'];

export default function Orders() {
  const { t, money, num, date } = useApp();
  const orders = useStore((s) => s.orders);
  const del = useStore((s) => s.deleteOrder);
  const restore = useStore((s) => s.restoreOrder);
  const update = useStore((s) => s.updateOrder);
  const toast = useUI((s) => s.toast);

  const [q, setQ] = useState('');
  const dq = useDebounced(q, 150);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<Order | null>(null);

  const kpi = useMemo(() => {
    const by = (s: OrderStatus) => orders.filter((o) => o.status === s);
    const sum = (l: Order[]) => l.reduce((a, o) => a + o.total, 0);
    return {
      all: { n: orders.length, rev: sum(orders.filter((o) => o.status !== 'Cancelled')) },
      done: { n: by('Completed').length, rev: sum(by('Completed')) },
      pend: { n: by('Pending').length + by('In progress').length, rev: sum([...by('Pending'), ...by('In progress')]) },
      canc: { n: by('Cancelled').length, rev: sum(by('Cancelled')) },
    };
  }, [orders]);

  const rows = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (!s) return true;
      return [o.id, o.invoiceNo, o.customerName, ...o.items.map((i) => i.name)].some((v) => v.toLowerCase().includes(s));
    });
  }, [orders, dq, status]);

  const remove = (o: Order) => {
    if (!window.confirm(`${t('confirm.delete')} #${o.id}?`)) return;
    del(o.id);
    toast(t('toast.deleted'), 'info', { label: t('undo'), run: () => restore(o) });
  };

  const exportCsv = () => {
    const head = ['Order ID', 'Invoice', 'Date', 'Customer', 'Items', 'Total (BDT)', 'Payment', 'Method', 'Status'];
    const body = rows.map((o) => [o.id, o.invoiceNo, date(o.date), o.customerName, o.items.map((i) => `${i.name} (${i.qty})`).join('; '), o.total, o.payStatus, o.method, o.status]);
    downloadFile('orders.csv', toCSV([head, ...body]), 'text/csv');
    toast(t('toast.exported'));
  };

  return (
    <Page>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-4 md:overflow-visible">
        <StatCard dark label={t('kpi.totalOrders')} value={kpi.all.n} format={(n) => num(Math.round(n))} icon={<ShoppingCart size={19} />} sub={`${t('revenue')}: ${money(kpi.all.rev, 0)}`} />
        <StatCard label={t('kpi.completed')} value={kpi.done.n} format={(n) => num(Math.round(n))} icon={<CheckCircle2 size={19} />} iconTone="green" sub={`${t('revenue')}: ${money(kpi.done.rev, 0)}`} />
        <StatCard label={t('kpi.pending')} value={kpi.pend.n} format={(n) => num(Math.round(n))} icon={<Clock size={19} />} iconTone="amber" sub={`${t('approx')}: ${money(kpi.pend.rev, 0)}`} />
        <StatCard label={t('kpi.cancelled')} value={kpi.canc.n} format={(n) => num(Math.round(n))} icon={<XCircle size={19} />} iconTone="red" sub={`${t('lost')}: ${money(kpi.canc.rev, 0)}`} />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
            <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search') + '…'} aria-label={t('search')} />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className={cn('btn-ghost', (showFilters || status !== 'all') && 'border-brand-600')} onClick={() => setShowFilters((v) => !v)}><Filter size={16} /> {t('filters')}</button>
            <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> {t('export')}</button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-soft p-3">
            {(['all', ...STATUSES] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition', status === s ? 'bg-brand-800 text-white' : 'bg-card hover:bg-line')}>
                {s === 'all' ? t('all') : t('s.' + s)}
              </button>
            ))}
          </div>
        )}

        <DataTable
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={setView}
          empty={<EmptyState icon={<ShoppingCart size={28} />} title={t('empty.orders')} />}
          columns={[
            { key: 'id', header: t('col.orderId'), render: (o) => <span className="font-medium">#{o.id}</span> },
            { key: 'cust', header: t('col.customer'), render: (o) => o.customerName },
            { key: 'date', header: t('col.date'), render: (o) => <span className="text-muted">{date(o.date)}</span> },
            {
              key: 'items',
              header: t('col.items'),
              render: (o) => <span className="line-clamp-2 max-w-[220px] text-xs">{o.items.map((i) => `${i.name} (${num(i.qty)})`).join(', ')}</span>,
            },
            { key: 'total', header: t('col.total'), render: (o) => <span className="font-semibold">{money(o.total)}</span> },
            { key: 'pay', header: t('col.payment'), render: (o) => <Badge tone={toneOf(o.payStatus)}>{t('s.' + o.payStatus)}</Badge> },
            {
              key: 'st',
              header: t('col.status'),
              render: (o) => (
                <span onClick={(e) => e.stopPropagation()}>
                  <select
                    value={o.status}
                    onChange={(e) => { update(o.id, { status: e.target.value as OrderStatus }); toast(t('toast.statusUpdated')); }}
                    className={cn('cursor-pointer appearance-none rounded-full px-2.5 py-1 text-[11px] font-medium outline-none',
                      o.status === 'Completed' ? 'bg-emerald-500/12 text-emerald-600' : o.status === 'Cancelled' ? 'bg-rose-500/12 text-rose-600' : 'bg-amber-400/20 text-amber-600')}
                    aria-label={t('col.status')}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{t('s.' + s)}</option>)}
                  </select>
                </span>
              ),
            },
            {
              key: 'act',
              header: t('col.action'),
              render: (o) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink" onClick={() => setView(o)} aria-label={t('view')}><Eye size={15} /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink" onClick={() => setView(o)} aria-label={t('print')}><Printer size={15} /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-rose-500/10 hover:text-rose-500" onClick={() => remove(o)} aria-label={t('delete')}><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <ReceiptModal order={view} onClose={() => setView(null)} />
    </Page>
  );
}
