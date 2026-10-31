import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, MoreVertical, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCountUp, useApp } from '../hooks/useApp';

/* ---------- Badge ---------- */
export type Tone = 'green' | 'amber' | 'red' | 'orange' | 'gray' | 'blue';
const TONES: Record<Tone, string> = {
  green: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-400/20 text-amber-600 dark:text-amber-400',
  red: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  orange: 'bg-orange-400/15 text-orange-600 dark:text-orange-400',
  gray: 'bg-soft text-muted',
  blue: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none', TONES[tone])}>{children}</span>;
}

export function toneOf(status: string): Tone {
  switch (status) {
    case 'Paid':
    case 'Completed':
    case 'in':
      return 'green';
    case 'Pending':
    case 'In progress':
    case 'low':
      return 'amber';
    case 'expiring':
      return 'orange';
    case 'Failed':
    case 'Cancelled':
    case 'Due':
    case 'out':
    case 'expired':
      return 'red';
    default:
      return 'gray';
  }
}

/* ---------- Trend pill ---------- */
export function Trend({ value, dark }: { value: number; dark?: boolean }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        dark ? 'bg-lime text-brand-900' : up ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
      )}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {up ? '+' : '−'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/* ---------- Stat card (KPI) ---------- */
export function StatCard({
  label,
  value,
  format,
  icon,
  iconTone = 'gray',
  trend,
  sub,
  dark,
  onClick,
  active,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon?: ReactNode;
  iconTone?: 'gray' | 'amber' | 'red' | 'green' | 'lime';
  trend?: number;
  sub?: string;
  dark?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const { t } = useApp();
  const shown = useCountUp(value);
  const bubble = {
    gray: 'bg-soft text-ink',
    amber: 'bg-amber-300/30 text-amber-500',
    red: 'bg-rose-400/20 text-rose-500',
    green: 'bg-emerald-400/20 text-emerald-600',
    lime: 'bg-lime text-brand-900',
  }[iconTone];
  const isDark = dark || active;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={cn(
        'relative flex min-w-[220px] flex-1 flex-col md:min-w-0 justify-between rounded-3xl p-5 shadow-card transition-colors',
        isDark ? 'bg-gradient-to-br from-brand-900 to-brand-700 text-white' : 'bg-card',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && <span className={cn('grid h-11 w-11 place-items-center rounded-full', isDark ? 'bg-lime text-brand-900' : bubble)}>{icon}</span>}
          <span className={cn('text-sm', isDark ? 'text-white/80' : 'text-muted')}>{label}</span>
        </div>
        <MoreVertical size={16} className={isDark ? 'text-white/60' : 'text-muted'} aria-label={t('more')} />
      </div>
      <div className="mt-3">
        <div className="text-[28px] font-bold leading-none tracking-tight">{format(shown)}</div>
        {(trend !== undefined || sub) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {trend !== undefined && <Trend value={trend} dark={isDark} />}
            {sub && <span className={isDark ? 'text-white/75' : 'text-muted'}>{sub}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-emerald-500' : 'bg-line')}
    >
      <span className={cn('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-200', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

/* ---------- Modal & Drawer ---------- */
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg', footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: string; footer?: ReactNode }) {
  useEsc(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="no-print fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-card shadow-pop', width)}
            initial={{ y: 24, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <button className="btn-icon h-9 w-9" onClick={onClose} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-4">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useEsc(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="no-print fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-card shadow-pop sm:rounded-l-4xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <button className="btn-icon h-9 w-9" onClick={onClose} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-soft text-brand-600">{icon}</div>
      <div className="text-base font-semibold">{title}</div>
      {hint && <div className="max-w-xs text-sm text-muted">{hint}</div>}
      {action}
    </div>
  );
}

/* ---------- Page wrapper with entry animation ---------- */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="space-y-4">
      {children}
    </motion.div>
  );
}
