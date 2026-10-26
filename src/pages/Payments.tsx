import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, HandCoins, Search, XCircle, CreditCard } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp, useDebounced } from '../hooks/useApp';
import { Badge, EmptyState, Modal, Page, StatCard, toneOf } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { cn, downloadFile, toCSV } from '../lib/utils';
import type { Order, PayMethod } from '../types';

const METHODS: PayMethod[] = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Card', 'Bank Transfer'];
const FILTERS = ['all', 'Paid', 'Pending', 'Due', 'Failed'] as const;

export default function Payments() {
  const { t, money, num, date } = useApp();
  const orders = useStore((s) => s.orders);
  const payments = useStore((s) => s.payments);
  const collect = useStore((s) => s.collectDue);
  const toast = useUI((s) => s.toast);
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 150);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [target, setTarget] = useState<Order | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('Cash');

  const kpi = useMemo(() => {
    const sum = (l: Order[]) => l.reduce((s, o) => s + o.total, 0);
    const paid = orders.filter((o) => o.payStatus === 'Paid');
    const pend = orders.filter((o) => o.payStatus === 'Pending' || o.payStatus === 'Due');
    const fail = orders.filter((o) => o.payStatus === 'Failed');
    return { paid: [paid.length, sum(paid)], pend: [pend.length, pend.reduce((s, o) => s + (o.total - o.paid), 0)], fail: [fail.length, sum(fail)] };
  }, [orders]);

  const rows = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return orders.filter((o) => (filter === 'all' || o.payStatus === filter) && (!s || [o.id, o.customerName, o.invoiceNo, o.method].some((v) => v.toLowerCase().includes(s))));
  }, [orders, dq, filter]);

  const openCollect = (o: Order) => {
    setTarget(o);
    setAmount(String(Math.max(0, o.total - o.paid)));
    setMethod('Cash');
  };
  const remaining = target ? target.total - target.paid : 0;
  const submit = () => {
    const a = Number(amount);
    if (!target || !(a > 0)) return toast(t('err.price'), 'error');
    if (a > remaining + 0.001) return toast(t('pay.tooMuch'), 'error');
    collect(target.id, a, method);
    toast(t('pay.collected'));
    setTarget(null);
  };

  const exportCsv = () => {
    downloadFile('payments.csv', toCSV([['Transaction', 'Customer', 'Date', 'Total (BDT)', 'Paid (BDT)', 'Status', 'Method', 'Order'], ...rows.map((o) => ['TXN-' + o.id.replace(/\D/g, ''), o.customerName, date(o.date), o.total, o.paid, o.payStatus, o.method, o.id])]), 'text/csv');
    toast(t('toast.exported'));
  };

  return (
    <Page>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        <StatCard label={t('pay.completed')} value={kpi.paid[0]} format={(n) => num(Math.round(n))} icon={<CheckCircle2 size={19} />} iconTone="green" sub={`${t('revenue')}: ${money(kpi.paid[1], 0)}`} />
        <StatCard label={t('pay.pending')} value={kpi.pend[0]} format={(n) => num(Math.round(n))} icon={<AlertTriangle size={19} />} iconTone="amber" sub={`${t('s.Due')}: ${money(kpi.pend[1], 0)}`} />
        <StatCard label={t('pay.failed')} value={kpi.fail[0]} format={(n) => num(Math.round(n))} icon={<XCircle size={19} />} iconTone="red" sub={`${t('lost')}: ${money(kpi.fail[1], 0)}`} />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
            <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search') + '…'} aria-label={t('search')} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('rounded-full px-3.5 py-2 text-xs font-medium transition', filter === f ? 'bg-brand-800 text-white' : 'bg-soft hover:bg-line')}>
                {f === 'all' ? t('all') : t('s.' + f)}
              </button>
            ))}
          </div>
          <button className="btn-ghost ml-auto" onClick={exportCsv}><Download size={16} /> {t('export')}</button>
        </div>

        <DataTable
          rows={rows}
          rowKey={(o) => o.id}
          empty={<EmptyState icon={<CreditCard size={28} />} title={t('empty.payments')} />}
          columns={[
            { key: 'tx', header: t('col.txn'), render: (o) => <span className="text-muted">#TXN{o.id.replace(/\D/g, '')}</span> },
            { key: 'c', header: t('col.customer'), render: (o) => o.customerName },
            { key: 'd', header: t('col.date'), render: (o) => <span className="text-muted">{date(o.date)}</span> },
            { key: 'a', header: t('col.amount'), render: (o) => <span className="font-semibold">{money(o.total)}</span> },
            { key: 'p', header: t('pay.received'), render: (o) => money(o.paid) },
            { key: 's', header: t('col.status'), render: (o) => <Badge tone={toneOf(o.payStatus)}>{t('s.' + o.payStatus)}</Badge> },
            { key: 'm', header: t('col.method'), render: (o) => o.method },
            { key: 'o', header: t('col.orderId'), render: (o) => <span className="text-muted">#{o.id}</span> },
            {
              key: 'act',
              header: t('col.action'),
              render: (o) =>
                o.payStatus === 'Due' ? (
                  <button className="btn-lime h-8 px-3 text-xs" onClick={() => openCollect(o)}><HandCoins size={14} /> {t('pay.collect')}</button>
                ) : (
                  <span className="text-muted">—</span>
                ),
            },
          ]}
        />
      </section>

      {payments.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('pay.ledger')}</h2>
          <ul className="divide-y divide-line text-sm">
            {payments.slice(0, 15).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span>#{p.id} · {p.customerName} · #{p.orderId} · {date(p.date)}</span>
                <span className="font-semibold">{money(p.amount)} <span className="text-xs font-normal text-muted">({p.method})</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={t('pay.collect')}
        footer={<><button className="btn-ghost" onClick={() => setTarget(null)}>{t('cancel')}</button><button className="btn-lime" onClick={submit}>{t('pay.collect')}</button></>}
      >
        {target && (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl bg-soft p-4 text-sm">
              <div className="font-semibold">{target.customerName} · #{target.id}</div>
              <div className="mt-1 text-muted">{t('col.amount')}: {money(target.total)} · {t('pay.received')}: {money(target.paid)}</div>
              <div className="mt-1 font-bold text-rose-500">{t('s.Due')}: {money(remaining)}</div>
            </div>
            <div>
              <label className="label">{t('col.amount')} (৳)</label>
              <input className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
              <p className="mt-1 text-xs text-muted">{t('pay.partialHint')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={cn('rounded-full px-3.5 py-2 text-xs font-medium transition', method === m ? 'bg-brand-800 text-white' : 'bg-soft hover:bg-line')}>{m}</button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
