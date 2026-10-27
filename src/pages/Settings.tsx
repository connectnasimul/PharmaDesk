import { useRef, type ReactNode } from 'react';
import { Download, Plus, RotateCcw, Upload } from 'lucide-react';
import type { Role } from '../types';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Page, Toggle } from '../components/ui';
import { Receipt } from '../components/Receipt';
import { downloadFile } from '../lib/utils';
import type { Lang, Order, Paper, Theme } from '../types';

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const SAMPLE: Order = {
  id: 'ORD000', invoiceNo: 'INV-0000', date: new Date().toISOString(), customerName: 'Walk-in',
  items: [
    { productId: 'x', name: 'Napa', strength: '500mg', qty: 10, price: 1.5, cost: 1 },
    { productId: 'y', name: 'Seclo', strength: '20mg', qty: 14, price: 6, cost: 4 },
  ],
  subtotal: 99, discount: 0, vat: 0, total: 99, paid: 100, method: 'Cash', payStatus: 'Paid', status: 'Completed', cashier: 'Admin',
};

export default function Settings() {
  const { t, settings } = useApp();
  const set = useStore((s) => s.setSettings);
  const reset = useStore((s) => s.resetDemo);
  const addSample = useStore((s) => s.addSampleProducts);
  const importData = useStore((s) => s.importData);
  const toast = useUI((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const p = settings.pharmacy;

  const setP = (patch: Partial<typeof p>) => set({ pharmacy: { ...p, ...patch } });

  const backup = () => {
    const { products, orders, customers, suppliers, purchases, payments, settings: st } = useStore.getState();
    downloadFile(`pharmadesk-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ products, orders, customers, suppliers, purchases, payments, settings: st }, null, 2), 'application/json');
    toast(t('toast.exported'));
  };

  const restore = async (file?: File) => {
    if (!file) return;
    const ok = importData(await file.text());
    toast(ok ? t('toast.restored') : t('toast.restoreFail'), ok ? 'success' : 'error');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Page>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <section className="card px-6 py-2">
            <Row title={t('set.appearance')} desc={t('set.appearanceDesc')}>
              <select className="field w-36" value={settings.theme} onChange={(e) => set({ theme: e.target.value as Theme })}>
                <option value="light">{t('set.light')}</option>
                <option value="dark">{t('set.dark')}</option>
                <option value="system">{t('set.system')}</option>
              </select>
            </Row>
            <Row title={t('set.language')} desc={t('set.languageDesc')}>
              <select className="field w-36" value={settings.lang} onChange={(e) => set({ lang: e.target.value as Lang })}>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </Row>
            <Row title={t('set.bnDigits')} desc={t('set.bnDigitsDesc')}>
              <Toggle checked={settings.bnDigits} onChange={(v) => set({ bnDigits: v })} label={t('set.bnDigits')} />
            </Row>
            <Row title={t('set.refill')} desc={t('set.refillDesc')}>
              <input className="field w-28 text-right" type="number" min={1} max={365} value={settings.refillDays} onChange={(e) => set({ refillDays: Math.min(365, Math.max(1, Number(e.target.value) || 30)) })} />
            </Row>
            <Row title={t('set.vat')} desc={t('set.vatDesc')}>
              <input className="field w-28 text-right" type="number" min={0} max={100} step="0.5" value={settings.vat} onChange={(e) => set({ vat: Math.max(0, Number(e.target.value) || 0) })} />
            </Row>
          </section>

          <section className="card px-6 py-5">
            <h2 className="mb-4 text-lg font-bold">{t('set.pharmacy')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">{t('set.pName')}</label><input className="field" value={p.name} onChange={(e) => setP({ name: e.target.value })} /></div>
              <div><label className="label">{t('set.pPhone')}</label><input className="field" value={p.phone} onChange={(e) => setP({ phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">{t('set.pAddress')}</label><input className="field" value={p.address} onChange={(e) => setP({ address: e.target.value })} /></div>
              <div><label className="label">{t('r.license')}</label><input className="field" value={p.license} onChange={(e) => setP({ license: e.target.value })} /></div>
              <div><label className="label">BIN</label><input className="field" value={p.bin} onChange={(e) => setP({ bin: e.target.value })} /></div>
            </div>
          </section>

          <section className="card px-6 py-2">
            <h2 className="pb-1 pt-4 text-lg font-bold">{t('set.receipt')}</h2>
            <Row title={t('set.paper')} desc={t('set.paperDesc')}>
              <select className="field w-36" value={settings.paper} onChange={(e) => set({ paper: e.target.value as Paper })}>
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
                <option value="A4">A4</option>
              </select>
            </Row>
            <Row title={t('set.copies')}>
              <input className="field w-28 text-right" type="number" min={1} max={5} value={settings.copies} onChange={(e) => set({ copies: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })} />
            </Row>
            <Row title={t('set.showQr')}><Toggle checked={settings.showQr} onChange={(v) => set({ showQr: v })} label={t('set.showQr')} /></Row>
            <Row title={t('set.showWords')}><Toggle checked={settings.showWords} onChange={(v) => set({ showWords: v })} label={t('set.showWords')} /></Row>
            <div className="py-4">
              <label className="label">{t('set.footer')}</label>
              <textarea className="field-box" rows={3} value={settings.footer} onChange={(e) => set({ footer: e.target.value })} />
            </div>
          </section>

          <section className="card px-6 py-2">
            <h2 className="pb-1 pt-4 text-lg font-bold">{t('set.security')}</h2>
            <Row title={t('set.lock')} desc={t('set.lockDesc')}>
              <Toggle checked={settings.lock} onChange={(v) => set({ lock: v })} label={t('set.lock')} />
            </Row>
            {settings.lock && (
              <div className="grid gap-3 py-4 sm:grid-cols-3">
                {(['Admin', 'Pharmacist', 'Cashier'] as Role[]).map((r) => (
                  <div key={r}>
                    <label className="label">{t('role.' + r)} PIN</label>
                    <input
                      className="field text-center tracking-[0.4em]"
                      inputMode="numeric"
                      maxLength={4}
                      value={settings.pins[r]}
                      onChange={(e) => set({ pins: { ...settings.pins, [r]: e.target.value.replace(/\D/g, '').slice(0, 4) } })}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted sm:col-span-3">{t('set.pinHint')}</p>
              </div>
            )}
          </section>

          <section className="card px-6 py-2">
            <h2 className="pb-1 pt-4 text-lg font-bold">{t('set.data')}</h2>
            <Row title={t('set.backup')} desc={t('set.backupDesc')}>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={backup}><Download size={16} /> {t('set.backupBtn')}</button>
                <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('set.restoreBtn')}</button>
                <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => restore(e.target.files?.[0])} />
              </div>
            </Row>
            <Row title={t('set.sample')} desc={t('set.sampleDesc')}>
              <button className="btn-ghost" onClick={() => { const n = addSample(); toast(n ? `${t('set.sampleDone')}: ${n}` : t('set.sampleNone'), n ? 'success' : 'info'); }}><Plus size={16} /> {t('set.sampleBtn')}</button>
            </Row>
            <Row title={t('set.reset')} desc={t('set.resetDesc')}>
              <button className="btn-ghost text-rose-600" onClick={() => { if (window.confirm(t('set.resetConfirm'))) { reset(); toast(t('toast.reset')); } }}><RotateCcw size={16} /> {t('set.resetBtn')}</button>
            </Row>
          </section>
        </div>

        <aside className="card h-fit p-5 xl:sticky xl:top-24">
          <h2 className="mb-3 text-lg font-bold">{t('set.preview')}</h2>
          <div className="overflow-x-auto rounded-2xl bg-soft p-4">
            <div className="mx-auto w-fit shadow-card" style={settings.paper === 'A4' ? { zoom: 0.4 } : undefined}>
              <Receipt order={{ ...SAMPLE, date: new Date().toISOString() }} settings={settings} />
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}
