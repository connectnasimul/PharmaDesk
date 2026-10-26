import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ShoppingCart, Users, CornerDownLeft, ArrowRight, Plus } from 'lucide-react';
import { useUI } from '../store/ui';
import { useStore } from '../store';
import { useApp } from '../hooks/useApp';
import { Modal } from './ui';
import { canOpen } from '../lib/access';
import { cn } from '../lib/utils';

interface Item { id: string; label: string; hint?: string; icon: typeof Search; run: () => void }

const PAGES = ['/', '/products', '/orders', '/pos', '/sales', '/customers', '/payments', '/suppliers', '/reports', '/settings', '/help'];
const PAGE_KEY: Record<string, string> = {
  '/': 'nav.overview', '/products': 'nav.products', '/orders': 'nav.orders', '/pos': 'nav.pos', '/sales': 'nav.sales',
  '/customers': 'nav.customers', '/payments': 'nav.payments', '/suppliers': 'nav.suppliers', '/reports': 'nav.reports',
  '/settings': 'nav.settings', '/help': 'nav.help',
};

export default function CommandPalette({ role }: { role: Parameters<typeof canOpen>[0] }) {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPalette);
  const setQuery = useUI((s) => s.setQuery);
  const { t, money } = useApp();
  const navigate = useNavigate();
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl/Cmd+K toggles the palette from anywhere
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUI.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setOpen]);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); }
  }, [open]);

  const go = (path: string) => { setOpen(false); navigate(path); };

  const items: Item[] = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out: Item[] = [];
    PAGES.filter((p) => canOpen(role, p)).forEach((p) => {
      const label = t(PAGE_KEY[p]);
      if (!s || label.toLowerCase().includes(s)) out.push({ id: 'p' + p, label, hint: t('palette.page'), icon: ArrowRight, run: () => go(p) });
    });
    if (canOpen(role, '/pos') && (!s || t('qa.newSale').toLowerCase().includes(s))) out.push({ id: 'a-sale', label: t('qa.newSale'), hint: t('palette.action'), icon: Plus, run: () => go('/pos') });
    if (canOpen(role, '/products') && (!s || t('qa.addProduct').toLowerCase().includes(s))) out.push({ id: 'a-prod', label: t('qa.addProduct'), hint: t('palette.action'), icon: Plus, run: () => go('/products?new=1') });
    if (s.length >= 2) {
      if (canOpen(role, '/products'))
        products.filter((p) => [p.name, p.generic, p.barcode].some((v) => v.toLowerCase().includes(s))).slice(0, 5)
          .forEach((p) => out.push({ id: 'pr' + p.id, label: `${p.name} ${p.strength}`, hint: `${p.generic} · ${money(p.price)}`, icon: Package, run: () => { setQuery(p.name); go('/products'); } }));
      if (canOpen(role, '/customers'))
        customers.filter((c) => [c.name, c.phone].some((v) => v.toLowerCase().includes(s))).slice(0, 4)
          .forEach((c) => out.push({ id: 'cu' + c.id, label: c.name, hint: c.phone, icon: Users, run: () => go('/customers') }));
      if (canOpen(role, '/orders'))
        orders.filter((o) => [o.id, o.invoiceNo].some((v) => v.toLowerCase().includes(s))).slice(0, 4)
          .forEach((o) => out.push({ id: 'or' + o.id, label: `#${o.id} · ${o.customerName}`, hint: money(o.total), icon: ShoppingCart, run: () => go('/orders') }));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, products, customers, orders, role, t]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[sel]?.run(); }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={t('palette.title')} width="max-w-xl">
      <div className="pb-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-3.5 text-muted" />
          <input autoFocus className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={t('palette.placeholder')} aria-label={t('search')} />
        </div>
        <div ref={listRef} className="mt-3 max-h-[340px] space-y-1 overflow-y-auto">
          {items.map((it, i) => (
            <button
              key={it.id}
              data-i={i}
              onMouseMove={() => setSel(i)}
              onClick={it.run}
              className={cn('flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors', i === sel ? 'bg-brand-800 text-white' : 'hover:bg-soft')}
            >
              <it.icon size={16} className={i === sel ? 'text-lime' : 'text-muted'} />
              <span className="flex-1 truncate font-medium">{it.label}</span>
              {it.hint && <span className={cn('truncate text-xs', i === sel ? 'text-white/70' : 'text-muted')}>{it.hint}</span>}
              {i === sel && <CornerDownLeft size={13} className="text-white/70" />}
            </button>
          ))}
          {items.length === 0 && <div className="py-10 text-center text-sm text-muted">{t('palette.none')}</div>}
        </div>
      </div>
    </Modal>
  );
}
