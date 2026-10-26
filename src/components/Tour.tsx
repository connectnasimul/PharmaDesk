import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Package, ScanLine, Printer, Languages } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Modal } from './ui';
import { cn } from '../lib/utils';

const STEPS = [
  { icon: LayoutGrid, k: 'tour.1' },
  { icon: Package, k: 'tour.2' },
  { icon: ScanLine, k: 'tour.3' },
  { icon: Printer, k: 'tour.4' },
  { icon: Languages, k: 'tour.5' },
];

/** Short first-launch tour; reopen from Help & Support. */
export default function Tour() {
  const open = useUI((s) => s.tourOpen);
  const setTour = useUI((s) => s.setTour);
  const toured = useStore((s) => s.settings.toured);
  const setSettings = useStore((s) => s.setSettings);
  const role = useUI((s) => s.role);
  const lock = useStore((s) => s.settings.lock);
  const { t } = useApp();
  const [i, setI] = useState(0);

  // first launch only, and not while the lock screen is showing
  useEffect(() => {
    if (!toured && (!lock || role)) setTour(true);
  }, [toured, lock, role, setTour]);
  useEffect(() => { if (open) setI(0); }, [open]);

  const close = () => { setTour(false); if (!toured) setSettings({ toured: true }); };
  const last = i === STEPS.length - 1;
  const S = STEPS[i];

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('tour.title')}
      width="max-w-md"
      footer={
        <>
          <button className="btn-ghost" onClick={close}>{t('tour.skip')}</button>
          {i > 0 && <button className="btn-ghost" onClick={() => setI(i - 1)}>{t('tour.back')}</button>}
          <button className="btn-lime" onClick={() => (last ? close() : setI(i + 1))}>{last ? t('tour.done') : t('tour.next')}</button>
        </>
      }
    >
      <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-lime text-brand-900"><S.icon size={28} /></div>
        <p className="max-w-xs text-sm leading-relaxed">{t(S.k)}</p>
        <div className="flex gap-1.5">
          {STEPS.map((_, k) => <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-6 bg-brand-800' : 'w-1.5 bg-line')} />)}
        </div>
      </motion.div>
    </Modal>
  );
}
