import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, Building2, CreditCard, Minus, Pause, PlayCircle, Plus, ScanLine, Search, Smartphone, Trash2, UserPlus, Wallet, X, Stethoscope, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Badge, Modal, Page, toneOf } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { daysToExpiry, isSellable, stockStatus, substitutes } from '../lib/stock';
import { cn } from '../lib/utils';
import type { Order, PayMethod, Product } from '../types';

interface CartLine { id: string; qty: number }
interface Held { id: number; label: string; cart: CartLine[]; customerId: string }

const METHODS: { m: PayMethod; icon: typeof Banknote }[] = [
  { m: 'Cash', icon: Banknote },
  { m: 'bKash', icon: Smartphone },
  { m: 'Nagad', icon: Smartphone },
  { m: 'Rocket', icon: Smartphone },
  { m: 'Card', icon: CreditCard },
  { m: 'Bank Transfer', icon: Building2 },
  { m: 'Due', icon: Wallet },
];

export default function POS() {
  const { t, money, num, settings } = useApp();
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const createOrder = useStore((s) => s.createOrder);
  const addCustomer = useStore((s) => s.addCustomer);
  const toast = useUI((s) => s.toast);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discVal, setDiscVal] = useState('');
  const [discType, setDiscType] = useState<'৳' | '%'>('৳');
  const [method, setMethod] = useState<PayMethod>('Cash');
  const [received, setReceived] = useState('');
  const [customerId, setCustomerId] = useState('walk');
  const [doctor, setDoctor] = useState('');
  const [held, setHeld] = useState<Held[]>([]);
  const [done, setDone] = useState<Order | null>(null);
  const [newCust, setNewCust] = useState(false);
  const [nc, setNc] = useState({ name: '', phone: '' });
  const [heldOpen, setHeldOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => (!cat || p.category === cat) && (!s || [p.name, p.generic, p.barcode, p.manufacturer].some((v) => v.toLowerCase().includes(s))))
      .slice(0, 60);
  }, [products, q, cat]);

  /* ----- cart maths ----- */
  const lines = cart
    .map((c) => ({ p: byId.get(c.id) as Product, qty: c.qty }))
    .filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const dv = Math.max(0, Number(discVal) || 0);
  const discount = Math.min(subtotal, discType === '%' ? (subtotal * Math.min(dv, 100)) / 100 : dv);
  const taxable = subtotal - discount;
  const vat = Math.round(((taxable * settings.vat) / 100) * 100) / 100;
  const total = Math.round((taxable + vat) * 100) / 100;
  const rec = Number(received) || 0;
  const change = method === 'Cash' && rec > total ? rec - total : 0;
  const customer = customers.find((c) => c.id === customerId);

  /* ----- actions ----- */
  const add = (p: Product) => {
    if (daysToExpiry(p.expiry) < 0) return toast(`${p.name}: ${t('pos.expiredBlock')}`, 'error');
    if (p.qty <= 0) {
      const alt = substitutes(products, p).slice(0, 3);
      return toast(alt.length ? `${t('pos.outStock')} ${t('pos.try')}: ${alt.map((a) => `${a.name} ${a.strength}`).join(', ')}` : t('pos.outStock'), 'error');
    }
    if (daysToExpiry(p.expiry) <= 30) toast(`${p.name}: ${t('pos.nearExpiry')}`, 'info');
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      if (ex) {
        if (ex.qty >= p.qty) {
          toast(`${t('pos.maxStock')} (${num(p.qty)})`, 'error');
          return c;
        }
        return c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...c, { id: p.id, qty: 1 }];
    });
  };

  const setQty = (id: string, qty: number) => {
    const p = byId.get(id);
    if (!p) return;
    if (qty <= 0) return setCart((c) => c.filter((l) => l.id !== id));
    if (qty > p.qty) {
      toast(`${t('pos.maxStock')} (${num(p.qty)})`, 'error');
      qty = p.qty;
    }
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty } : l)));
  };

  const clear = () => {
    setCart([]);
    setDiscVal('');
    setReceived('');
    setDoctor('');
    setCustomerId('walk');
    setMethod('Cash');
  };

  const hold = () => {
    if (!cart.length) return;
    setHeld((h) => [...h, { id: Date.now(), label: `${num(cart.length)} ${t('items')} · ${money(total, 0)}`, cart, customerId }]);
    clear();
    toast(t('pos.held'), 'info');
  };
  const resume = (h: Held) => {
    setCart(h.cart);
    setCustomerId(h.customerId);
    setHeld((x) => x.filter((y) => y.id !== h.id));
    setHeldOpen(false);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const s = q.trim();
    if (!s) return;
    const hit = products.find((p) => p.barcode === s) ?? (list.length === 1 ? list[0] : undefined);
    if (hit) {
      add(hit);
      setQ('');
    }
  };

  const charge = () => {
    if (!lines.length) return toast(t('pos.emptyCart'), 'error');
    if (method === 'Due' && !customer) return toast(t('pos.dueNeedsCustomer'), 'error');
    if (method === 'Cash' && received !== '' && rec < total) return toast(t('pos.cashLess'), 'error');
    const paid = method === 'Due' ? 0 : method === 'Cash' && rec > 0 ? rec : total;
    const order = createOrder({
      customerId: customer?.id,
      customerName: customer?.name ?? t('walkIn'),
      customerPhone: customer?.phone,
      items: lines.map((l) => ({ productId: l.p.id, name: l.p.name, strength: l.p.strength, qty: l.qty, price: l.p.price, cost: l.p.cost })),
      subtotal,
      discount,
      vat,
      total,
      paid,
      method,
      doctor: doctor.trim() || undefined,
    });
    clear();
    setDone(order);
  };

  const saveCustomer = () => {
    if (!nc.name.trim()) return toast(t('err.required'), 'error');
    const c = addCustomer({ name: nc.name.trim(), phone: nc.phone.trim() });
    setCustomerId(c.id);
    setNc({ name: '', phone: '' });
    setNewCust(false);
    toast(t('toast.customerAdded'));
  };

  /* ----- keyboard shortcuts: F2 search, F4 customer, F8 pay, Esc clear ----- */
  const chargeRef = useRef(charge);
  chargeRef.current = charge;
  const custSelRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (done || newCust) return;
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'F4') { e.preventDefault(); custSelRef.current?.focus(); }
      else if (e.key === 'F8') { e.preventDefault(); chargeRef.current(); }
      else if (e.key === 'Escape') { setQ(''); (document.activeElement as HTMLElement | null)?.blur(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [done, newCust]);

  return (
    <Page>
      <div className="grid gap-4 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
        {/* LEFT: product finder */}
        <section className="card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <ScanLine size={17} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
              <input
                ref={searchRef}
                className="field pl-11 pr-14"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder={t('pos.searchPlaceholder')}
                aria-label={t('search')}
              />
              <kbd className="absolute right-3 top-3 rounded-md bg-soft px-1.5 py-0.5 text-[10px] text-muted">F2</kbd>
            </div>
            {held.length > 0 && (
              <button className="btn-ghost" onClick={() => setHeldOpen(true)}><PlayCircle size={16} /> {t('pos.held')} ({num(held.length)})</button>
            )}
          </div>

          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            {['', ...categories].map((c) => (
              <button key={c || 'all'} onClick={() => setCat(c)} className={cn('shrink-0 rounded-full px-4 py-2 text-xs font-medium transition', cat === c ? 'bg-brand-800 text-white' : 'bg-soft hover:bg-line')}>
                {c || t('all')}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => {
              const st = stockStatus(p);
              const sellable = isSellable(p);
              const inCart = cart.find((l) => l.id === p.id)?.qty ?? 0;
              return (
                <motion.button
                  layout
                  key={p.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => add(p)}
                  className={cn(
                    'relative flex flex-col rounded-2xl border p-3 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-card',
                    sellable ? 'border-line bg-card' : 'border-line bg-soft/60 opacity-70',
                    inCart > 0 && 'border-brand-600 ring-1 ring-brand-600/30'
                  )}
                >
                  {inCart > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-brand-800 px-1 text-xs font-bold text-lime">{num(inCart)}</span>}
                  <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
                  <div className="line-clamp-1 text-[11px] text-muted">{p.strength} · {p.generic}</div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-sm font-bold">{money(p.price)}</span>
                    <Badge tone={toneOf(st)}>{st === 'in' ? num(p.qty) : t('st.' + st)}</Badge>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {list.length === 0 && <div className="py-12 text-center text-sm text-muted">{t('empty.products')}</div>}
        </section>

        {/* RIGHT: cart */}
        <section className="card flex h-fit flex-col p-5 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('pos.cart')} {lines.length > 0 && <span className="text-muted">({num(lines.length)})</span>}</h2>
            <div className="flex gap-1">
              <button className="btn-icon h-9 w-9" onClick={hold} disabled={!cart.length} title={t('pos.hold')} aria-label={t('pos.hold')}><Pause size={15} /></button>
              <button className="btn-icon h-9 w-9" onClick={clear} disabled={!cart.length} title={t('clear') + ' (Esc)'} aria-label={t('clear')}><Trash2 size={15} /></button>
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <select ref={custSelRef} className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)} aria-label={t('col.customer')}>
                <option value="walk">{t('walkIn')}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <button className="btn-icon shrink-0" onClick={() => setNewCust(true)} title={t('addCustomer')} aria-label={t('addCustomer')}><UserPlus size={16} /></button>
          </div>

          <div className="max-h-[300px] min-h-[96px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.div key={l.p.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 rounded-2xl bg-soft/70 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{l.p.name} <span className="text-xs font-normal text-muted">{l.p.strength}</span></div>
                      <div className="text-xs text-muted">{money(l.p.price)}</div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-card p-1">
                      <button className="grid h-7 w-7 place-items-center rounded-full hover:bg-soft" onClick={() => setQty(l.p.id, l.qty - 1)} aria-label="−"><Minus size={13} /></button>
                      <input className="w-9 bg-transparent text-center text-sm font-semibold outline-none" inputMode="numeric" value={l.qty} onChange={(e) => setQty(l.p.id, Number(e.target.value.replace(/\D/g, '')) || 0)} aria-label={t('col.qty')} />
                      <button className="grid h-7 w-7 place-items-center rounded-full hover:bg-soft" onClick={() => setQty(l.p.id, l.qty + 1)} aria-label="+"><Plus size={13} /></button>
                    </div>
                    <div className="w-[72px] text-right text-sm font-bold">{money(l.p.price * l.qty)}</div>
                    <button className="text-muted hover:text-rose-500" onClick={() => setQty(l.p.id, 0)} aria-label={t('delete')}><X size={15} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {lines.length === 0 && (
              <div className="grid place-items-center gap-2 py-8 text-center text-sm text-muted">
                <ScanLine size={28} className="text-brand-600" />
                {t('pos.emptyHint')}
              </div>
            )}
          </div>

          {/* totals */}
          <div className="mt-4 space-y-2 border-t border-dashed border-line pt-4 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted">{t('subtotal')}</span><span>{money(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">{t('discount')}</span>
              <div className="flex items-center gap-1.5">
                <input className="h-9 w-24 rounded-full border border-line bg-card px-3 text-right text-sm outline-none focus:border-brand-600" inputMode="decimal" value={discVal} onChange={(e) => setDiscVal(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" aria-label={t('discount')} />
                <div className="flex rounded-full bg-soft p-0.5 text-xs">
                  {(['৳', '%'] as const).map((d) => (
                    <button key={d} onClick={() => setDiscType(d)} className={cn('h-8 w-8 rounded-full font-semibold transition', discType === d ? 'bg-brand-800 text-white' : 'text-muted')}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            {settings.vat > 0 && <div className="flex items-center justify-between"><span className="text-muted">{t('vat')} ({num(settings.vat)}%)</span><span>{money(vat)}</span></div>}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {METHODS.map(({ m, icon: Icon }) => (
              <button key={m} onClick={() => setMethod(m)} className={cn('flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-[11px] font-medium transition', method === m ? 'border-brand-700 bg-brand-800 text-white' : 'border-line hover:bg-soft')}>
                <Icon size={16} />
                <span className="leading-tight">{m === 'Bank Transfer' ? 'Bank' : m === 'Due' ? t('s.Due') : m}</span>
              </button>
            ))}
          </div>

          {method === 'Cash' && (
            <div className="mt-3 flex items-center gap-3">
              <input className="field" inputMode="decimal" value={received} onChange={(e) => setReceived(e.target.value.replace(/[^\d.]/g, ''))} placeholder={t('pos.received')} aria-label={t('pos.received')} />
              <div className="shrink-0 text-right text-xs text-muted">{t('r.change')}<div className="text-base font-bold text-ink">{money(change)}</div></div>
            </div>
          )}
          {method === 'Due' && !customer && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-400/15 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"><AlertTriangle size={14} /> {t('pos.dueNeedsCustomer')}</div>
          )}

          <div className="relative mt-3">
            <Stethoscope size={15} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
            <input className="field pl-10" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder={t('pos.doctor')} aria-label={t('pos.doctor')} />
          </div>

          <button className="btn-lime mt-4 h-14 w-full text-base font-bold shadow-sm" onClick={charge} disabled={!lines.length}>
            {t('pos.charge')} {money(total)} <kbd className="ml-1 rounded-md bg-brand-900/10 px-1.5 py-0.5 text-[10px] font-medium">F8</kbd>
          </button>
        </section>
      </div>

      {/* Held carts */}
      <Modal open={heldOpen} onClose={() => setHeldOpen(false)} title={t('pos.held')}>
        <ul className="space-y-2 py-2">
          {held.map((h) => (
            <li key={h.id} className="flex items-center justify-between rounded-2xl bg-soft p-3">
              <span className="text-sm">{h.label}</span>
              <button className="btn-lime h-9" onClick={() => resume(h)}>{t('pos.resume')}</button>
            </li>
          ))}
          {held.length === 0 && <li className="py-6 text-center text-sm text-muted">—</li>}
        </ul>
      </Modal>

      {/* New customer */}
      <Modal
        open={newCust}
        onClose={() => setNewCust(false)}
        title={t('addCustomer')}
        footer={<><button className="btn-ghost" onClick={() => setNewCust(false)}>{t('cancel')}</button><button className="btn-lime" onClick={saveCustomer}>{t('save')}</button></>}
      >
        <div className="space-y-3 py-2">
          <div><label className="label">{t('col.customer')} *</label><input autoFocus className="field" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveCustomer()} /></div>
          <div><label className="label">{t('col.phone')}</label><input className="field" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} placeholder="+8801XXXXXXXXX" onKeyDown={(e) => e.key === 'Enter' && saveCustomer()} /></div>
        </div>
      </Modal>

      {/* Receipt after payment */}
      <ReceiptModal order={done} onClose={() => { setDone(null); searchRef.current?.focus(); }} primaryLabel={t('pos.newSale')} />
    </Page>
  );
}
