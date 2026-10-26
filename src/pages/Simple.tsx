import { useState } from 'react';
import { ChevronDown, Hammer, Keyboard, PlayCircle } from 'lucide-react';
import { useUI } from '../store/ui';
import { cn } from '../lib/utils';
import { Page } from '../components/ui';
import { useApp } from '../hooks/useApp';

/** Honest placeholder for modules that are scheduled for the next build step. */
export function ComingNext({ titleKey }: { titleKey: string }) {
  const { t } = useApp();
  return (
    <Page>
      <div className="card grid place-items-center gap-3 px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-lime text-brand-900"><Hammer size={26} /></div>
        <h2 className="text-xl font-bold">{t(titleKey)}</h2>
        <p className="max-w-sm text-sm text-muted">{t('next.desc')}</p>
      </div>
    </Page>
  );
}

const SHORTCUTS = [
  ['Ctrl / ⌘ + K', 'help.k.search'],
  ['F2', 'help.k.f2'],
  ['F4', 'help.k.f4'],
  ['F8', 'help.k.f8'],
  ['F9', 'help.k.f9'],
  ['Esc', 'help.k.esc'],
];

const FAQ = [1, 2, 3, 4, 5, 6];

export function Help() {
  const { t } = useApp();
  const setTour = useUI((s) => s.setTour);
  const [open, setOpen] = useState<number | null>(1);
  return (
    <Page>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{t('help.faq')}</h2>
            <button className="btn-ghost h-9" onClick={() => setTour(true)}><PlayCircle size={16} /> {t('help.tour')}</button>
          </div>
          <ul className="divide-y divide-line">
            {FAQ.map((n) => (
              <li key={n}>
                <button className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-semibold" onClick={() => setOpen(open === n ? null : n)} aria-expanded={open === n}>
                  {t(`faq.q${n}`)}
                  <ChevronDown size={16} className={cn('shrink-0 text-muted transition-transform', open === n && 'rotate-180')} />
                </button>
                {open === n && <p className="pb-4 text-sm leading-relaxed text-muted">{t(`faq.a${n}`)}</p>}
              </li>
            ))}
          </ul>
        </section>
        <section className="card h-fit p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Keyboard size={19} /> {t('help.shortcuts')}</h2>
          <ul className="divide-y divide-line">
            {SHORTCUTS.map(([k, d]) => (
              <li key={k} className="flex items-center justify-between py-3 text-sm">
                <span>{t(d)}</span>
                <kbd className="rounded-lg bg-soft px-2.5 py-1 text-xs font-semibold">{k}</kbd>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
