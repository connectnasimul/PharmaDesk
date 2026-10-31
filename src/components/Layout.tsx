import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, BarChart3, Bell, CheckCircle2, ChevronDown, CircleHelp, CreditCard, Heart, LayoutGrid, LogOut, Menu, Package,
  PanelLeft, Receipt, Search, Settings as SettingsIcon, ShoppingCart, Truck, Users, X, XCircle, ScanLine, FileBarChart,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../hooks/useApp';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { stockStatus } from '../lib/stock';
import { canOpen, homeFor } from '../lib/access';
import { useRole } from '../hooks/useRole';
import { PrintHost } from './PrintHost';
import CommandPalette from './CommandPalette';
import Tour from './Tour';
import type { Role } from '../types';

const NAV = [
  { to: '/', key: 'nav.overview', icon: LayoutGrid },
  { to: '/products', key: 'nav.products', icon: Package },
  { to: '/orders', key: 'nav.orders', icon: ShoppingCart },
  { to: '/pos', key: 'nav.pos', icon: ScanLine },
  { to: '/sales', key: 'nav.sales', icon: BarChart3 },
  { to: '/customers', key: 'nav.customers', icon: Users },
  { to: '/payments', key: 'nav.payments', icon: CreditCard },
  { to: '/suppliers', key: 'nav.suppliers', icon: Truck },
  { to: '/reports', key: 'nav.reports', icon: FileBarChart },
];
const NAV_BOTTOM = [
  { to: '/help', key: 'nav.help', icon: CircleHelp },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-brand-900">
        <Receipt size={19} strokeWidth={2.4} />
      </div>
      {!small && <span className="text-[22px] font-bold tracking-tight text-white">PharmaDesk</span>}
    </div>
  );
}

function SidebarBody({ collapsed, onNavigate, role }: { collapsed?: boolean; onNavigate?: () => void; role: Role }) {
  const { t } = useApp();
  const lock = useStore((s) => s.settings.lock);
  const setRole = useUI((s) => s.setRole);
  const toggle = useUI((s) => s.toggleCollapsed);
  const link = (item: (typeof NAV)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      title={collapsed ? t(item.key) : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-200',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-lime text-brand-900 shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <item.icon size={18} />
      {!collapsed && <span>{t(item.key)}</span>}
    </NavLink>
  );
  return (
    <div className="flex h-full flex-col p-3">
      <div className={cn('mb-5 flex items-center px-2 pt-2', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo small={collapsed} />
        {!collapsed && (
          <button onClick={toggle} className="hidden text-white/70 transition hover:text-white lg:block" aria-label="Collapse sidebar">
            <PanelLeft size={18} />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={toggle} className="mx-auto mb-3 hidden text-white/70 hover:text-white lg:block" aria-label="Expand sidebar"><PanelLeft size={18} /></button>
      )}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">{[...NAV, ...NAV_BOTTOM].filter((n) => canOpen(role, n.to)).map(link)}</nav>

      {!collapsed && (
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2">
          <Heart size={15} className="shrink-0 text-lime" />
          <div className="min-w-0">
            <div className="text-xs font-bold leading-tight text-lime">{t('free.title')}</div>
            <p className="truncate text-[10px] leading-tight text-white/60">Ctrl+K</p>
          </div>
        </div>
      )}
      <button
        className={cn('mt-1 flex h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm text-white/80 transition hover:bg-white/10 hover:text-white', collapsed && 'justify-center px-0')}
        onClick={() => (lock ? setRole(null) : useUI.getState().toast(t('toast.demoLogout'), 'info'))}
      >
        <LogOut size={18} />
        {!collapsed && t('nav.logout')}
      </button>
    </div>
  );
}

function Notifications() {
  const { t, num } = useApp();
  const products = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = useMemo(() => {
    const st = products.map((p) => stockStatus(p));
    const out = st.filter((s) => s === 'out').length;
    const low = st.filter((s) => s === 'low').length;
    const exp = st.filter((s) => s === 'expiring').length;
    const expired = st.filter((s) => s === 'expired').length;
    const dues = orders.filter((o) => o.payStatus === 'Due').length;
    const failed = orders.filter((o) => o.payStatus === 'Failed').length;
    return [
      { n: out, text: t('notif.out'), icon: XCircle, c: 'text-rose-500', to: '/products' },
      { n: low, text: t('notif.low'), icon: AlertTriangle, c: 'text-amber-500', to: '/products' },
      { n: exp + expired, text: t('notif.expiring'), icon: AlertTriangle, c: 'text-orange-500', to: '/products' },
      { n: dues, text: t('notif.dues'), icon: CreditCard, c: 'text-sky-500', to: '/orders' },
      { n: failed, text: t('notif.failed'), icon: XCircle, c: 'text-rose-500', to: '/orders' },
    ].filter((i) => i.n > 0);
  }, [products, orders, t]);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-icon relative" onClick={() => setOpen((o) => !o)} aria-label={t('notifications')}>
        <Bell size={18} />
        {items.length > 0 && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-72 rounded-2xl bg-card p-2 shadow-pop"
          >
            <div className="px-3 py-2 text-sm font-semibold">{t('notifications')}</div>
            {items.length === 0 && <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted"><CheckCircle2 size={16} className="text-emerald-500" />{t('notif.none')}</div>}
            {items.map((i) => (
              <button key={i.text} onClick={() => { setOpen(false); navigate(i.to); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-soft">
                <i.icon size={17} className={i.c} />
                <span className="flex-1">{i.text}</span>
                <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-semibold">{num(i.n)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu({ role }: { role: Role }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-card pl-1 pr-3 transition hover:bg-soft">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-sm font-bold text-lime">{role[0]}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{t('role.' + role)}</span>
          <span className="block text-[11px] text-muted">@{role.toLowerCase()}</span>
        </span>
        <ChevronDown size={14} className="text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="absolute right-0 z-40 mt-2 w-48 rounded-2xl bg-card p-2 shadow-pop">
            <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-soft" onClick={() => { setOpen(false); navigate('/settings'); }}>{t('nav.settings')}</button>
            <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-soft" onClick={() => { setOpen(false); navigate('/help'); }}>{t('nav.help')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TITLES: Record<string, string> = {
  '/': 'nav.overview', '/products': 'nav.products', '/orders': 'nav.orders', '/pos': 'nav.pos', '/sales': 'nav.sales',
  '/customers': 'nav.customers', '/payments': 'nav.payments', '/suppliers': 'nav.suppliers', '/reports': 'nav.reports',
  '/settings': 'nav.settings', '/help': 'nav.help',
};

function Topbar({ role }: { role: Role }) {
  const { t } = useApp();
  const loc = useLocation();
  const setMobile = useUI((s) => s.setMobileMenu);
  const setPalette = useUI((s) => s.setPalette);

  return (
    <header className="no-print sticky top-0 z-30 mb-4 flex items-center gap-3 rounded-3xl bg-card px-4 py-3 shadow-card sm:px-6">
      <button className="btn-icon lg:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu size={18} /></button>
      <div className="min-w-0 flex-1 lg:flex-none lg:basis-72">
        <h1 className="truncate text-lg font-bold leading-tight">{t(TITLES[loc.pathname] ?? 'nav.overview')}</h1>
        <p className="hidden truncate text-xs text-muted sm:block">{t('subtitle')}</p>
      </div>
      <button onClick={() => setPalette(true)} className="field relative hidden flex-1 items-center pl-10 pr-4 text-left text-muted md:flex" aria-label={t('search')}>
        <Search size={16} className="pointer-events-none absolute left-4 top-3.5" />
        <span className="flex-1">{t('search')}…</span>
        <kbd className="rounded-md bg-soft px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button className="btn-icon md:hidden" onClick={() => setPalette(true)} aria-label={t('search')}><Search size={18} /></button>
        <Notifications />
        <UserMenu role={role} />
      </div>
    </header>
  );
}

function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="no-print pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-brand-900 py-2.5 pl-4 pr-3 text-sm text-white shadow-pop"
          >
            {t.tone === 'success' && <CheckCircle2 size={17} className="text-lime" />}
            {t.tone === 'error' && <XCircle size={17} className="text-rose-400" />}
            {t.tone === 'info' && <CircleHelp size={17} className="text-sky-300" />}
            <span>{t.text}</span>
            {t.actionLabel && (
              <button className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-brand-900" onClick={() => { t.onAction?.(); dismiss(t.id); }}>{t.actionLabel}</button>
            )}
            <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white" aria-label="Dismiss"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function Layout() {
  const collapsed = useUI((s) => s.collapsed);
  const mobile = useUI((s) => s.mobileMenu);
  const setMobile = useUI((s) => s.setMobileMenu);
  const loc = useLocation();
  const role = useRole() as Role; // App only renders Layout when unlocked

  useEffect(() => setMobile(false), [loc.pathname, setMobile]);

  if (!canOpen(role, loc.pathname)) return <Navigate to={homeFor(role)} replace />;

  return (
    <div className="flex h-full gap-3 p-3">
      <aside
        className={cn(
          'no-print hidden shrink-0 rounded-4xl bg-gradient-to-b from-brand-900 to-brand-800 shadow-card transition-[width] duration-300 lg:block',
          collapsed ? 'w-[84px]' : 'w-[264px]'
        )}
      >
        <SidebarBody collapsed={collapsed} role={role} />
      </aside>

      <AnimatePresence>
        {mobile && (
          <div className="no-print fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside
              className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-brand-900 to-brand-800 shadow-pop"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <button className="absolute right-3 top-4 text-white/70" onClick={() => setMobile(false)} aria-label="Close"><X size={20} /></button>
              <SidebarBody onNavigate={() => setMobile(false)} role={role} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 overflow-y-auto rounded-4xl pr-1">
        <Topbar role={role} />
        <div className="pb-6">
          <Outlet />
        </div>
      </main>
      <Toasts />
      <CommandPalette role={role} />
      <Tour />
      <PrintHost />
    </div>
  );
}
