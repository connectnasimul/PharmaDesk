import { useMemo, useState } from 'react';
import { HandCoins, Plus, Trash2, Truck, Undo2, Wallet, PackagePlus } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Badge, EmptyState, Modal, Page, StatCard } from '../components/ui';
import { DataTable } from '../components/DataTable';
import type { Purchase, PurchaseItem } from '../types';

interface Line { productId: string; qty: string; cost: string }

export default function Suppliers() {
  const { t, money, num, date } = useApp();
  const suppliers = useStore((s) => s.suppliers);
  const purchases = useStore((s) => s.purchases);
  const products = useStore((s) => s.products);
  const addSupplier = useStore((s) => s.addSupplier);
  const createPurchase = useStore((s) => s.createPurchase);
  const paySupplier = useStore((s) => s.paySupplier);
  const returnPurchase = useStore((s) => s.returnPurchase);
  const toast = useUI((s) => s.toast);

  const [supOpen, setSupOpen] = useState(false);
  const [sf, setSf] = useState({ name: '', phone: '', address: '' });
  const [buyOpen, setBuyOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', qty: '', cost: '' }]);
  const [paid, setPaid] = useState('');
  const [payFor, setPayFor] = useState<Purchase | null>(null);
  const [payAmt, setPayAmt] = useState('');
  const [retFor, setRetFor] = useState<Purchase | null>(null);
  const [retQty, setRetQty] = useState<Record<string, string>>({});

  const returnedQty = (p: Purchase, productId: string) => (p.returns ?? []).filter((r) => r.productId === productId).reduce((a, r) => a + r.qty, 0);
  const submitReturn = () => {
    if (!retFor) return;
    const lines = Object.entries(retQty).map(([productId, q]) => ({ productId, qty: Number(q) || 0 })).filter((l) => l.qty > 0);
    const amount = returnPurchase(retFor.id, lines);
    if (amount <= 0) return toast(t('sup.returnNone'), 'error');
    toast(`${t('sup.returned')}: ${money(amount)}`);
    setRetFor(null);
    setRetQty({});
  };

  const returnedAmt = (p: Purchase) => (p.returns ?? []).reduce((a, r) => a + r.amount, 0);
  const dueOf = (p: Purchase) => Math.max(0, p.total - returnedAmt(p) - p.paid);
  const kpi = useMemo(
    () => ({
      suppliers: suppliers.length,
      bought: purchases.reduce((s, p) => s + p.total, 0),
      due: purchases.reduce((s, p) => s + dueOf(p), 0),
    }),
    [suppliers, purchases]
  );
  const supDue = useMemo(() => {
    const m = new Map<string, number>();
    purchases.forEach((p) => m.set(p.supplierId, (m.get(p.supplierId) ?? 0) + dueOf(p)));
    return m;
  }, [purchases]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const pickProduct = (i: number, id: string) => {
    const p = products.find((x) => x.id === id);
    setLine(i, { productId: id, cost: p ? String(p.cost) : '' });
  };
  const buyTotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0);

  const submitBuy = () => {
    if (!supplierId) return toast(t('sup.pickSupplier'), 'error');
    const items: PurchaseItem[] = lines
      .filter((l) => l.productId && Number(l.qty) > 0 && Number(l.cost) >= 0)
      .map((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        return { productId: p.id, name: `${p.name} ${p.strength}`.trim(), qty: Number(l.qty), cost: Number(l.cost) };
      });
    if (!items.length) return toast(t('sup.addItems'), 'error');
    createPurchase({ supplierId, items, paid: Number(paid) || 0 });
    toast(t('sup.purchased'));
    setBuyOpen(false);
    setLines([{ productId: '', qty: '', cost: '' }]);
    setPaid('');
  };

  const saveSupplier = () => {
    if (!sf.name.trim()) return toast(t('err.required'), 'error');
    addSupplier({ name: sf.name.trim(), phone: sf.phone.trim(), address: sf.address.trim() });
    setSf({ name: '', phone: '', address: '' });
    setSupOpen(false);
    toast(t('sup.added'));
  };

  const submitPay = () => {
    const a = Number(payAmt);
    if (!payFor || !(a > 0)) return toast(t('err.price'), 'error');
    if (a > dueOf(payFor) + 0.001) return toast(t('pay.tooMuch'), 'error');
    paySupplier(payFor.id, a);
    toast(t('pay.collected'));
    setPayFor(null);
  };

  return (
    <Page>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        <StatCard dark label={t('nav.suppliers')} value={kpi.suppliers} format={(n) => num(Math.round(n))} icon={<Truck size={19} />} />
        <StatCard label={t('sup.totalPurchases')} value={kpi.bought} format={(n) => money(n, 0)} icon={<PackagePlus size={19} />} iconTone="green" />
        <StatCard label={t('sup.dues')} value={kpi.due} format={(n) => money(n, 0)} icon={<Wallet size={19} />} iconTone="amber" />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t('sup.purchases')}</h2>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setSupOpen(true)}><Plus size={16} /> {t('sup.addSupplier')}</button>
            <button className="btn-lime" onClick={() => { setSupplierId(suppliers[0]?.id ?? ''); setBuyOpen(true); }}><PackagePlus size={17} /> {t('sup.newPurchase')}</button>
          </div>
        </div>
        <DataTable
          rows={purchases}
          rowKey={(p) => p.id}
          empty={<EmptyState icon={<PackagePlus size={28} />} title={t('sup.emptyPurchases')} hint={t('sup.emptyHint')} />}
          columns={[
            { key: 'id', header: t('col.id'), render: (p) => <span className="text-muted">#{p.id}</span> },
            { key: 'd', header: t('col.date'), render: (p) => date(p.date) },
            { key: 's', header: t('nav.suppliers'), render: (p) => <span className="font-medium">{p.supplierName}</span> },
            { key: 'i', header: t('col.items'), render: (p) => <span className="line-clamp-2 max-w-[220px] text-xs">{p.items.map((i) => `${i.name} (${num(i.qty)})`).join(', ')}</span> },
            { key: 't', header: t('col.total'), render: (p) => <span className="font-semibold">{money(p.total - returnedAmt(p))}</span> },
            { key: 'p', header: t('r.paid'), render: (p) => money(p.paid) },
            { key: 'u', header: t('s.Due'), render: (p) => (dueOf(p) > 0 ? <Badge tone="red">{money(dueOf(p))}</Badge> : <Badge tone="green">{t('s.Paid')}</Badge>) },
            {
              key: 'a',
              header: t('col.action'),
              render: (p) => (
                <div className="flex gap-1.5">
                  {dueOf(p) > 0 && <button className="btn-lime h-8 px-3 text-xs" onClick={() => { setPayFor(p); setPayAmt(String(dueOf(p))); }}><HandCoins size={14} /> {t('sup.pay')}</button>}
                  <button className="btn-ghost h-8 px-3 text-xs" onClick={() => { setRetFor(p); setRetQty({}); }}><Undo2 size={14} /> {t('sup.return')}</button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold">{t('nav.suppliers')}</h2>
        <DataTable
          rows={suppliers}
          rowKey={(s) => s.id}
          initialPageSize={5}
          pageSizes={[5, 10, 20]}
          columns={[
            { key: 'id', header: t('col.id'), render: (s) => <span className="text-muted">#{s.id}</span> },
            { key: 'n', header: t('f.name'), render: (s) => <span className="font-semibold">{s.name}</span> },
            { key: 'p', header: t('col.phone'), render: (s) => s.phone || '—' },
            { key: 'a', header: t('set.pAddress'), render: (s) => s.address || '—' },
            { key: 'd', header: t('s.Due'), render: (s) => ((supDue.get(s.id) ?? 0) > 0 ? <Badge tone="red">{money(supDue.get(s.id) ?? 0)}</Badge> : <span className="text-muted">—</span>) },
          ]}
        />
      </section>

      <Modal
        open={supOpen}
        onClose={() => setSupOpen(false)}
        title={t('sup.addSupplier')}
        footer={<><button className="btn-ghost" onClick={() => setSupOpen(false)}>{t('cancel')}</button><button className="btn-lime" onClick={saveSupplier}>{t('save')}</button></>}
      >
        <div className="space-y-3 py-2">
          <div><label className="label">{t('f.name')} *</label><input autoFocus className="field" value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} /></div>
          <div><label className="label">{t('col.phone')}</label><input className="field" value={sf.phone} onChange={(e) => setSf({ ...sf, phone: e.target.value })} /></div>
          <div><label className="label">{t('set.pAddress')}</label><input className="field" value={sf.address} onChange={(e) => setSf({ ...sf, address: e.target.value })} /></div>
        </div>
      </Modal>

      <Modal
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        title={t('sup.newPurchase')}
        width="max-w-2xl"
        footer={<><button className="btn-ghost" onClick={() => setBuyOpen(false)}>{t('cancel')}</button><button className="btn-lime" onClick={submitBuy}>{t('save')} · {money(buyTotal)}</button></>}
      >
        <div className="space-y-3 py-2">
          <div>
            <label className="label">{t('nav.suppliers')}</label>
            <select className="field" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_88px_32px] items-center gap-2">
              <select className="field" value={l.productId} onChange={(e) => pickProduct(i, e.target.value)} aria-label={t('col.product')}>
                <option value="">{t('sup.selectProduct')}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} {p.strength}</option>)}
              </select>
              <input className="field px-3 text-center" inputMode="numeric" placeholder={t('col.qty')} value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value.replace(/\D/g, '') })} />
              <input className="field px-3 text-center" inputMode="decimal" placeholder="৳" value={l.cost} onChange={(e) => setLine(i, { cost: e.target.value.replace(/[^\d.]/g, '') })} />
              <button className="text-muted hover:text-rose-500" onClick={() => setLines((x) => (x.length > 1 ? x.filter((_, k) => k !== i) : x))} aria-label={t('delete')}><Trash2 size={16} /></button>
            </div>
          ))}
          <button className="btn-ghost h-9" onClick={() => setLines((l) => [...l, { productId: '', qty: '', cost: '' }])}><Plus size={14} /> {t('sup.addLine')}</button>
          <div>
            <label className="label">{t('sup.paidNow')} (৳)</label>
            <input className="field" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!retFor}
        onClose={() => setRetFor(null)}
        title={t('sup.return')}
        footer={<><button className="btn-ghost" onClick={() => setRetFor(null)}>{t('cancel')}</button><button className="btn-lime" onClick={submitReturn}>{t('sup.return')}</button></>}
      >
        {retFor && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted">{t('sup.returnHint')}</p>
            {retFor.items.map((i) => {
              const left = i.qty - returnedQty(retFor, i.productId);
              return (
                <div key={i.productId} className="flex items-center gap-3 rounded-2xl bg-soft p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{i.name}</div>
                    <div className="text-xs text-muted">{t('sup.canReturn')}: {num(left)} · {money(i.cost)}</div>
                  </div>
                  <input
                    className="field w-20 px-3 text-center"
                    inputMode="numeric"
                    disabled={left <= 0}
                    placeholder="0"
                    value={retQty[i.productId] ?? ''}
                    onChange={(e) => setRetQty({ ...retQty, [i.productId]: e.target.value.replace(/\D/g, '') })}
                    aria-label={t('col.qty')}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title={t('sup.pay')}
        footer={<><button className="btn-ghost" onClick={() => setPayFor(null)}>{t('cancel')}</button><button className="btn-lime" onClick={submitPay}>{t('sup.pay')}</button></>}
      >
        {payFor && (
          <div className="space-y-3 py-2">
            <div className="rounded-2xl bg-soft p-4 text-sm"><b>{payFor.supplierName}</b> · #{payFor.id}<div className="mt-1 font-bold text-rose-500">{t('s.Due')}: {money(dueOf(payFor))}</div></div>
            <div><label className="label">{t('col.amount')} (৳)</label><input className="field" inputMode="decimal" value={payAmt} onChange={(e) => setPayAmt(e.target.value.replace(/[^\d.]/g, ''))} /></div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
