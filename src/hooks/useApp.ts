import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { dict } from '../i18n/dict';
import { formatCurrency, formatDate, formatNumber, formatTime } from '../lib/format';

/** Translation + locale-aware formatters bound to the user's settings. */
export function useApp() {
  const settings = useStore((s) => s.settings);
  const { lang, bnDigits } = settings;

  const t = useCallback((key: string): string => dict[lang][key] ?? dict.en[key] ?? key, [lang]);
  const money = useCallback((n: number, decimals = 2) => formatCurrency(n, bnDigits, decimals), [bnDigits]);
  const num = useCallback((n: number) => formatNumber(n, bnDigits), [bnDigits]);
  const date = useCallback((iso: string) => formatDate(iso, bnDigits), [bnDigits]);
  const time = useCallback((iso: string) => formatTime(iso, bnDigits), [bnDigits]);

  return { t, money, num, date, time, lang, settings, bnDigits };
}

/** Animated count-up for KPI numbers */
export function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVal(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
