import { useMemo, useState } from 'react';
import { BellRing, Download, MessageCircle, MessageSquare, Phone, Plus, Repeat, Search, UserPlus, Users, Eye } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp, useDebounced } from '../hooks/useApp';
import { Badge, EmptyState, Modal, Page, StatCard, toneOf } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { cn, downloadFile, toCSV } from '../lib/utils';
import type { Customer } from '../types';

interface Row extends Customer {
  orders: number;
  spend: number;
  last?: string;
  due: number;
  refill: { name: string; days: number }[];
}

/** +8801XXXXXXXXX / 01XXXXXXXXX → 8801XXXXXXXXX (digits only, for wa.me) */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('880') ? d : d.startsWith('0') ? '88' + d : d;
};

export default function Customers() {
  const { t, money, num, date, settings } = useApp();
  const refillDays = settings.refillDays;
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const addCustomer = useStore((s) => s.addCustomer);
  const toast = useUI((s) => s.toast);
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 150);
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '' });
  const [err, setErr] = useState('');
  const [view, setView] = useState<Row | null>(null);
  const [onlyRefill, setOnlyRefill] = useState(false);

  const rows: Row[] = useMemo(
    () =>
      customers.map((c) => {
        const os = orders.filter((o) => o.customerId === c.id && o.status !== 'Cancelled');
        // last purchase date per medicine; due for a refill once `refillDays` have passed
        const lastBy = new Map<string, { name: string; ts: number }>();
        os.forEach((o) =>
          o.items.forEach((i) => {
            const ts = new Date(o.date).getTime();
            const cur = lastBy.get(i.productId);
            if (!cur || ts > cur.ts) lastBy.set(i.productId, { name: `${i.name} ${i.strength}`.trim(), ts });
          })
        );
        const refill = [...lastBy.values()]
          .map((x) => ({ name: x.name, days: Math.floor((Date.now() - x.ts) / 86400000) }))
          .filter((x) => x.days >= refillDays)
          .sort((a, b) => b.days - a.days);
        return {
          ...c,
          refill,
          orders: os.length,
          spend: os.reduce((s, o) => s + o.total, 0),
          last: os.length ? os.reduce((m, o) => (o.date > m ? o.date : m), os[0].date) : undefined,
          due: os.filter((o) => o.payStatus === 'Due').reduce((s, o) => s + Math.max(0, o.total - o.paid), 0),
        };
      }),
    [customers, orders, refillDays]
  );

  const kpi = useMemo(() => {
    const withOrders = rows.filter((r) => r.orders > 0);
    return {
      total: rows.length,
      withDue: rows.filter((r) => r.due > 0).length,
      returning: withOrders.length ? (withOrders.filter((r) => r.orders >= 2).length / withOrders.length) * 100 : 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const s = dq.trim().toLowerCase();
    if (onlyRefill) return rows.filter((r) => r.refill.length > 0 && (!s || [r.id, r.name, r.phone].some((v) => v.toLowerCase().includes(s))));
    return s ? rows.filter((r) => [r.id, r.name, r.phone, r.email ?? ''].some((v) => v.toLowerCase().includes(s))) : rows;
  }, [rows, dq, onlyRefill]);
  const refillCount = useMemo(() => rows.filter((r) => r.refill.length > 0).length, [rows]);

  const save = () => {
    if (!f.name.trim()) return setErr(t('err.required'));
    if (f.phone && !/^(\+?8801|01)[3-9]\d{8}$/.test(f.phone.replace(/[-\s]/g, ''))) return setErr(t('err.phone'));
    addCustomer({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined });
    setF({ name: '', phone: '', email: '' });
    setErr('');
    setAdd(false);
    toast(t('toast.customerAdded'));
  };

  const exportCsv = () => {
    downloadFile('customers.csv', toCSV([['ID', 'Name', 'Phone', 'Email', 'Orders', 'Total spend (BDT)', 'Due (BDT)'], ...filtered.map((r) => [r.id, r.name, r.phone, r.email ?? '', r.orders, r.spend, r.due])]), 'text/csv');
    toast(t('toast.exported'));
  };

  const history = view ? orders.filter((o) => o.customerId === view.id).slice(0, 20) : [];

  return (
    <Page>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        <StatCard dark label={t('kpi.customers')} value={kpi.total} format={(n) => num(Math.round(n))} icon={<Users size={19} />} />
        <StatCard label={t('cust.withDue')} value={kpi.withDue} format={(n) => num(Math.round(n))} icon={<UserPlus size={19} />} iconTone="amber" />
        <StatCard label={t('cust.returning')} value={kpi.returning} format={(n) => num(Math.round(n)) + '%'} icon={<Repeat size={19} />} iconTone="green" />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
            <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search') + '…'} aria-label={t('search')} />
          </div>
          <button className={cn('btn-ghost', onlyRefill && 'border-brand-600 bg-soft')} onClick={() => setOnlyRefill((v) => !v)}><BellRing size={16} /> {t('refill.due')} ({num(refillCount)})</button>
          <div className="ml-auto flex gap-2">
            <button className="btn-lime" onClick={() => setAdd(true)}><Plus size={17} /> {t('addCustomer')}</button>
            <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> {t('export')}</button>
          </div>
        </div>
        <DataTable
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={setView}
          empty={<EmptyState icon={<Users size={28} />} title={t('empty.customers')} />}
          columns={[
            { key: 'id', header: t('col.custId'), render: (r) => <span className="text-muted">#{r.id}</span> },
            { key: 'n', header: t('col.customer'), render: (r) => <span className="font-semibold">{r.name}</span> },
            { key: 'p', header: t('col.phone'), render: (r) => r.phone || '—' },
            { key: 'o', header: t('cust.orders'), render: (r) => num(r.orders) },
            { key: 's', header: t('cust.spend'), render: (r) => money(r.spend, 0) },
            { key: 'd', header: t('s.Due'), render: (r) => (r.due > 0 ? <Badge tone="red">{money(r.due, 0)}</Badge> : <span className="text-muted">—</span>) },
            { key: 'l', header: t('cust.last'), render: (r) => (r.last ? date(r.last) : '—') },
            { key: 'a', header: t('col.action'), render: (r) => <button className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink" onClick={(e) => { e.stopPropagation(); setView(r); }} aria-label={t('view')}><Eye size={15} /></button> },
          ]}
        />
      </section>

      <Modal
        open={add}
        onClose={() => setAdd(false)}
        title={t('addCustomer')}
        footer={<><button className="btn-ghost" onClick={() => setAdd(false)}>{t('cancel')}</button><button className="btn-lime" onClick={save}>{t('save')}</button></>}
      >
        <div className="space-y-3 py-2">
          <div><label className="label">{t('col.customer')} *</label><input autoFocus className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="label">{t('col.phone')}</label><input className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+8801XXXXXXXXX" /></div>
          <div><label className="label">Email</label><input className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          {err && <p className="text-xs text-rose-500">{err}</p>}
        </div>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name} width="max-w-xl">
        {view && (
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {view.phone || '—'}</span>
              <span>#{view.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[[t('cust.orders'), num(view.orders)], [t('cust.spend'), money(view.spend, 0)], [t('s.Due'), money(view.due, 0)]].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-soft p-3"><div className="text-xs text-muted">{l}</div><div className="mt-1 text-base font-bold">{v}</div></div>
              ))}
            </div>
            {view.refill.length > 0 && (
              <div className="rounded-2xl bg-amber-400/15 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><BellRing size={15} /> {t('refill.due')}</h4>
                <ul className="space-y-1 text-sm">
                  {view.refill.slice(0, 6).map((r) => (
                    <li key={r.name} className="flex justify-between gap-3"><span>{r.name}</span><span className="text-muted">{num(r.days)} {t('days')}</span></li>
                  ))}
                </ul>
                {view.phone && (() => {
                  const msg = `${t('refill.hello')} ${view.name}, ${t('refill.msg')}: ${view.refill.slice(0, 4).map((r) => r.name).join(', ')}. ${settings.pharmacy.name}, ${settings.pharmacy.phone}`;
                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className="btn-lime h-9 px-4 text-xs" target="_blank" rel="noreferrer" href={`https://wa.me/${waNumber(view.phone)}?text=${encodeURIComponent(msg)}`}><MessageCircle size={14} /> WhatsApp</a>
                      <a className="btn-ghost h-9 px-4 text-xs" href={`sms:${view.phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(msg)}`}><MessageSquare size={14} /> SMS</a>
                    </div>
                  );
                })()}
              </div>
            )}
            <h4 className="text-sm font-semibold">{t('cust.history')}</h4>
            <ul className="divide-y divide-line text-sm">
              {history.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0"><div className="font-medium">#{o.id} · {date(o.date)}</div><div className="truncate text-xs text-muted">{o.items.map((i) => `${i.name} (${num(i.qty)})`).join(', ')}</div></div>
                  <div className="text-right"><div className="font-semibold">{money(o.total)}</div><Badge tone={toneOf(o.payStatus)}>{t('s.' + o.payStatus)}</Badge></div>
                </li>
              ))}
              {history.length === 0 && <li className="py-6 text-center text-muted">—</li>}
            </ul>
          </div>
        )}
      </Modal>
    </Page>
  );
}
