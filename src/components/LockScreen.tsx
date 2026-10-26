import { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Lock } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { cn } from '../lib/utils';
import type { Role } from '../types';

const ROLES: Role[] = ['Admin', 'Pharmacist', 'Cashier'];

/** Role picker + PIN pad. Local-only convenience lock, not server-side security. */
export default function LockScreen() {
  const { t } = useApp();
  const pins = useStore((s) => s.settings.pins);
  const setRole = useUI((s) => s.setRole);
  const [role, setR] = useState<Role>('Admin');
  const [pin, setPin] = useState('');
  const [bad, setBad] = useState(false);

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setBad(false);
    if (next.length === 4) {
      if (next === pins[role]) setRole(role);
      else {
        setBad(true);
        setTimeout(() => setPin(''), 350);
      }
    }
  };

  return (
    <div className="grid h-full place-items-center bg-gradient-to-br from-brand-900 to-brand-800 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-4xl bg-card p-8 text-center shadow-pop">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-lime text-brand-900"><Lock size={24} /></div>
        <h1 className="text-xl font-bold">PharmaDesk</h1>
        <p className="mt-1 text-sm text-muted">{t('lock.enter')}</p>

        <div className="mt-5 flex justify-center gap-1.5 rounded-full bg-soft p-1">
          {ROLES.map((r) => (
            <button key={r} onClick={() => { setR(r); setPin(''); setBad(false); }} className={cn('flex-1 rounded-full px-3 py-2 text-xs font-medium transition', role === r ? 'bg-brand-800 text-white' : 'text-muted')}>
              {t('role.' + r)}
            </button>
          ))}
        </div>

        <motion.div animate={bad ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.3 }} className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-3.5 w-3.5 rounded-full border-2 transition', i < pin.length ? (bad ? 'border-rose-500 bg-rose-500' : 'border-brand-800 bg-brand-800') : 'border-line')} />)}
        </motion.div>

        <div className="mx-auto grid max-w-[240px] grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} onClick={() => press(d)} className="h-14 rounded-full bg-soft text-lg font-semibold transition hover:bg-line active:scale-95">{d}</button>
          ))}
          <span />
          <button onClick={() => press('0')} className="h-14 rounded-full bg-soft text-lg font-semibold transition hover:bg-line active:scale-95">0</button>
          <button onClick={() => setPin(pin.slice(0, -1))} className="grid h-14 place-items-center rounded-full text-muted transition hover:bg-soft" aria-label="Backspace"><Delete size={20} /></button>
        </div>
        {bad && <p className="mt-4 text-xs text-rose-500">{t('lock.wrong')}</p>}
      </motion.div>
    </div>
  );
}
