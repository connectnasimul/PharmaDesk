import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Boxes, Download, Filter, Package, Pencil, Plus, Search, Tags, Trash2, Upload, XCircle, Wand2 } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp, useDebounced } from '../hooks/useApp';
import { Badge, Drawer, EmptyState, Page, StatCard, toneOf } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { CATEGORIES, FORMS } from '../data/seed';
import { daysToExpiry, stockStatus, type StockStatus } from '../lib/stock';
import { cn, downloadExcel, downloadFile, toCSV } from '../lib/utils';
import { csvToProducts } from '../lib/csv';
import { buildLabels } from '../components/PrintHost';
import type { Product } from '../types';

const blank = (): Product => ({
  id: '',
  name: '',
  strength: '',
  generic: '',
  manufacturer: '',
  category: CATEGORIES[1],
  form: 'Tablet',
  unit: 'pcs',
  barcode: '',
  batch: '',
  expiry: '',
  cost: 0,
  price: 0,
  qty: 0,
  reorder: 20,
  shelf: '',
});

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function ProductForm({ initial, onClose }: { initial: Product | null; onClose: () => void }) {
  const { t } = useApp();
  const products = useStore((s) => s.products);
  const save = useStore((s) => s.saveProduct);
  const toast = useUI((s) => s.toast);
  const [f, setF] = useState<Product>(initial ?? blank());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setF(initial ?? blank());
    setErrors({});
  }, [initial]);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setF((p) => ({ ...p, [k]: v }));
  const numInput = (k: 'cost' | 'price' | 'qty' | 'reorder') => (
    <input className="field" type="number" min={0} step="any" value={f[k] === 0 ? '' : f[k]} placeholder="0" onChange={(e) => set(k, Number(e.target.value))} />
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = t('err.required');
    if (!f.expiry) er.expiry = t('err.required');
    if (!(f.price > 0)) er.price = t('err.price');
    if (f.qty < 0) er.qty = t('err.qty');
    setErrors(er);
    if (Object.keys(er).length) return;
    const max = products.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, '')) || 0), 0);
    save({ ...f, name: f.name.trim(), id: f.id || 'P' + String(max + 1).padStart(3, '0') });
    toast(initial ? t('toast.productUpdated') : t('toast.productAdded'));
    onClose();
  };

  return (
    <form id="product-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.name') + ' *'} error={errors.name}><input autoFocus className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Napa" /></Field></div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.strength')}><input className="field" value={f.strength} onChange={(e) => set('strength', e.target.value)} placeholder="500mg" /></Field></div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.generic')}><input className="field" value={f.generic} onChange={(e) => set('generic', e.target.value)} placeholder="Paracetamol" /></Field></div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.manufacturer')}><input className="field" value={f.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Beximco" /></Field></div>
      <div className="col-span-2 sm:col-span-1">
        <Field label={t('f.category')}>
          <select className="field" value={f.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Field label={t('f.form')}>
          <select className="field" value={f.form} onChange={(e) => set('form', e.target.value)}>
            {FORMS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Field label={t('f.barcode')}>
          <div className="flex gap-2">
            <input className="field" value={f.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="8801234567890" />
            <button type="button" className="btn-icon shrink-0" title={t('f.generate')} onClick={() => set('barcode', '88' + String(Date.now()).slice(-11))}><Wand2 size={16} /></button>
          </div>
        </Field>
      </div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.batch')}><input className="field" value={f.batch} onChange={(e) => set('batch', e.target.value)} /></Field></div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.expiry') + ' *'} error={errors.expiry}><input className="field" type="date" value={f.expiry} onChange={(e) => set('expiry', e.target.value)} /></Field></div>
      <div className="col-span-2 sm:col-span-1"><Field label={t('f.shelf')}><input className="field" value={f.shelf} onChange={(e) => set('shelf', e.target.value)} placeholder="R1-A" /></Field></div>
      <Field label={t('f.cost') + ' (৳)'}>{numInput('cost')}</Field>
      <Field label={t('f.price') + ' (৳) *'} error={errors.price}>{numInput('price')}</Field>
      <Field label={t('f.qty')} error={errors.qty}>{numInput('qty')}</Field>
      <Field label={t('f.reorder')}>{numInput('reorder')}</Field>
    </form>
  );
}

export default function Products() {
  const { t, money, num, date, settings } = useApp();
  const products = useStore((s) => s.products);
  const importProducts = useStore((s) => s.importProducts);
  const print = useUI((s) => s.print);
  const fileRef = useRef<HTMLInputElement>(null);
  const del = useStore((s) => s.deleteProduct);
  const restore = useStore((s) => s.restoreProduct);
  const toast = useUI((s) => s.toast);
  const globalQ = useUI((s) => s.query);
  const setGlobalQ = useUI((s) => s.setQuery);
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState(globalQ);
  const dq = useDebounced(q, 150);
  const [cat, setCat] = useState<string | null>(null);
  const [status, setStatus] = useState<StockStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get('new')) {
      setEdit(null);
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    if (globalQ) {
      setQ(globalQ);
      setGlobalQ('');
    }
  }, [globalQ, setGlobalQ]);

  const statusOf = useMemo(() => new Map(products.map((p) => [p.id, stockStatus(p)])), [products]);

  const kpi = useMemo(() => {
    const vals = [...statusOf.values()];
    return { total: products.length, low: vals.filter((s) => s === 'low').length, out: vals.filter((s) => s === 'out').length };
  }, [products, statusOf]);

  const cats = useMemo(() => {
    const names = [...new Set([...CATEGORIES, ...products.map((p) => p.category)])];
    return names
      .map((name) => {
        const list = products.filter((p) => p.category === name);
        return { name, count: list.length, attention: list.filter((p) => ['low', 'out', 'expired'].includes(statusOf.get(p.id) ?? '')).length };
      })
      .filter((c) => c.count > 0);
  }, [products, statusOf]);

  const rows = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (status !== 'all' && statusOf.get(p.id) !== status) return false;
      if (!s) return true;
      return [p.name, p.generic, p.manufacturer, p.barcode, p.id, p.category].some((v) => v.toLowerCase().includes(s));
    });
  }, [products, dq, cat, status, statusOf]);

  const exportExcel = () => {
    const head = ['ID', 'Name', 'Strength', 'Generic', 'Manufacturer', 'Category', 'Form', 'Barcode', 'Batch', 'Expiry', 'Qty', 'Cost (BDT)', 'Price (BDT)', 'Shelf'];
    downloadExcel('products', [head, ...rows.map((p) => [p.id, p.name, p.strength, p.generic, p.manufacturer, p.category, p.form, p.barcode, p.batch, p.expiry, p.qty, p.cost, p.price, p.shelf])]);
    toast(t('toast.exported'));
  };

  const exportCsv = () => {
    const head = ['ID', 'Name', 'Strength', 'Generic', 'Manufacturer', 'Category', 'Form', 'Barcode', 'Batch', 'Expiry', 'Qty', 'Cost (BDT)', 'Price (BDT)', 'Shelf'];
    const body = rows.map((p) => [p.id, p.name, p.strength, p.generic, p.manufacturer, p.category, p.form, p.barcode, p.batch, p.expiry, p.qty, p.cost, p.price, p.shelf]);
    downloadFile('products.csv', toCSV([head, ...body]), 'text/csv');
    toast(t('toast.exported'));
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    const { products: list, skipped } = csvToProducts(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (!list.length) return toast(t('import.none'), 'error');
    const n = importProducts(list);
    toast(`${t('import.done')}: ${num(n)}${skipped ? ` · ${t('import.skipped')}: ${num(skipped)}` : ''}`);
  };

  const printLabels = async () => {
    const list = rows.slice(0, 60);
    if (!list.length) return;
    const node = await buildLabels(list, 1, (n) => money(n), settings.pharmacy.name);
    print({ page: 'A4', node });
  };

  const remove = (p: Product) => {
    if (!window.confirm(`${t('confirm.delete')} "${p.name}"?`)) return;
    del(p.id);
    toast(t('toast.deleted'), 'info', { label: t('undo'), run: () => restore(p) });
  };

  const openNew = () => { setEdit(null); setOpen(true); };
  const openEdit = (p: Product) => { setEdit(p); setOpen(true); };

  return (
    <Page>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible">
        <StatCard label={t('kpi.totalProducts')} value={kpi.total} format={(n) => num(Math.round(n))} icon={<Boxes size={19} />} />
        <StatCard label={t('kpi.lowItems')} value={kpi.low} format={(n) => num(Math.round(n))} icon={<AlertTriangle size={19} />} iconTone="amber" onClick={() => setStatus(status === 'low' ? 'all' : 'low')} />
        <StatCard label={t('kpi.outOfStock')} value={kpi.out} format={(n) => num(Math.round(n))} icon={<XCircle size={19} />} iconTone="red" onClick={() => setStatus(status === 'out' ? 'all' : 'out')} />
      </div>

      {/* Category cards */}
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-4">
        {cats.map((c) => {
          const active = cat === c.name;
          return (
            <button
              key={c.name}
              onClick={() => setCat(active ? null : c.name)}
              className={cn(
                'min-w-[200px] snap-start rounded-3xl p-5 text-left shadow-card transition duration-200 hover:-translate-y-0.5',
                active ? 'bg-gradient-to-br from-brand-900 to-brand-700 text-white' : 'bg-card'
              )}
            >
              <div className={cn('text-sm', active ? 'text-white/80' : 'text-muted')}>{c.name}</div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-3xl font-bold leading-none">{num(c.count)}</span>
                {c.attention > 0 ? (
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', active ? 'bg-lime text-brand-900' : 'bg-amber-400/20 text-amber-600')}>{num(c.attention)} {t('needAttention')}</span>
                ) : (
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', active ? 'bg-lime text-brand-900' : 'bg-emerald-500/12 text-emerald-600')}>{t('allGood')}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
            <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search') + '…'} aria-label={t('search')} />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button className="btn-lime" onClick={openNew}><Plus size={17} /> {t('addProduct')}</button>
            <button className={cn('btn-ghost', (showFilters || status !== 'all') && 'border-brand-600')} onClick={() => setShowFilters((v) => !v)}><Filter size={16} /> {t('filters')}</button>
            <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> CSV</button>
            <button className="btn-ghost" onClick={exportExcel}><Download size={16} /> Excel</button>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('import')}</button>
            <button className="btn-ghost" onClick={printLabels}><Tags size={16} /> {t('labels')}</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-soft p-3">
            {(['all', 'in', 'low', 'out', 'expiring', 'expired'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition', status === s ? 'bg-brand-800 text-white' : 'bg-card hover:bg-line')}>
                {s === 'all' ? t('all') : t('st.' + s)}
              </button>
            ))}
            {(cat || status !== 'all') && (
              <button className="ml-auto text-xs font-medium text-brand-600 hover:underline" onClick={() => { setCat(null); setStatus('all'); }}>{t('clear')}</button>
            )}
          </div>
        )}

        <DataTable
          rows={rows}
          rowKey={(p) => p.id}
          empty={<EmptyState icon={<Package size={28} />} title={t('empty.products')} hint={t('empty.productsHint')} action={<button className="btn-lime" onClick={openNew}><Plus size={16} /> {t('addProduct')}</button>} />}
          columns={[
            { key: 'id', header: t('col.id'), render: (p) => <span className="text-muted">#{p.id}</span> },
            {
              key: 'name',
              header: t('col.product'),
              render: (p) => (
                <div>
                  <span className="font-semibold">{p.name}</span> <span className="text-xs text-muted">{p.strength}</span>
                  <div className="text-xs text-muted">{p.generic} · {p.manufacturer}</div>
                </div>
              ),
            },
            { key: 'cat', header: t('col.category'), render: (p) => <span className="text-muted">{p.category}</span> },
            { key: 'qty', header: t('col.qty'), render: (p) => `${num(p.qty)} ${p.unit}` },
            { key: 'price', header: t('col.price'), render: (p) => money(p.price) },
            {
              key: 'exp',
              header: t('col.expiry'),
              render: (p) => {
                const d = daysToExpiry(p.expiry);
                return (
                  <div>
                    <div>{date(p.expiry)}</div>
                    {d <= 90 && <div className={cn('text-[11px]', d < 0 ? 'text-rose-500' : 'text-orange-500')}>{d < 0 ? t('expired') : `${num(d)} ${t('daysLeft')}`}</div>}
                  </div>
                );
              },
            },
            { key: 'st', header: t('col.status'), render: (p) => { const s = statusOf.get(p.id) ?? 'in'; return <Badge tone={toneOf(s)}>{t('st.' + s)}</Badge>; } },
            {
              key: 'act',
              header: t('col.action'),
              render: (p) => (
                <div className="flex gap-1">
                  <button className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-soft hover:text-ink" onClick={() => openEdit(p)} aria-label={t('edit')}><Pencil size={15} /></button>
                  <button className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-rose-500/10 hover:text-rose-500" onClick={() => remove(p)} aria-label={t('delete')}><Trash2 size={15} /></button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? t('editProduct') : t('addProduct')}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>{t('cancel')}</button>
            <button className="btn-lime" type="submit" form="product-form">{t('save')}</button>
          </>
        }
      >
        <ProductForm initial={edit} onClose={() => setOpen(false)} />
      </Drawer>
    </Page>
  );
}
