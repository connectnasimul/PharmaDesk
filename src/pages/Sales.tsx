import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Coins, Download, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { useStore } from '../store';
import { useUI } from '../store/ui';
import { useApp } from '../hooks/useApp';
import { Page, StatCard } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { dateKey } from '../lib/format';
import { cn, downloadFile, toCSV } from '../lib/utils';

export default function Sales() {
  const { t, money, num } = useApp();
  const orders = useStore((s) => s.orders);
  const toast = useUI((s) => s.toast);
  const [range, setRange] = useState(14);
  const [hover, setHover] = useState<number | null>(null);

  // current period vs the previous period of the same length
  const calc = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const valid = orders.filter((o) => o.status !== 'Cancelled');
    const inRange = (o: { date: string }, from: number, to: number) => {
      const ts = new Date(o.date).getTime();
      return ts > now - to * day && ts <= now - from * day;
    };
    const agg = (list: typeof valid) => {
      const revenue = list.reduce((s, o) => s + o.total, 0);
      const cost = list.reduce((s, o) => s + o.items.reduce((c, i) => c + i.cost * i.qty, 0), 0);
      return { revenue, cost, profit: revenue - cost, count: list.length, aov: list.length ? revenue / list.length : 0 };
    };
    const cur = agg(valid.filter((o) => inRange(o, 0, range)));
    const prev = agg(valid.filter((o) => inRange(o, range, range * 2)));
    const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
    return {
      cur,
      trend: { revenue: pct(cur.revenue, prev.revenue), profit: pct(cur.profit, prev.profit), cost: pct(cur.cost, prev.cost), aov: pct(cur.aov, prev.aov) },
      list: valid.filter((o) => inRange(o, 0, range)),
    };
  }, [orders, range]);

  const series = useMemo(() => {
    const out: { key: string; label: string; v: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      out.push({ key: dateKey(d), label: dateKey(d).slice(8), v: 0 });
    }
    const idx = new Map(out.map((o, i) => [o.key, i]));
    calc.list.forEach((o) => {
      const i = idx.get(dateKey(new Date(o.date)));
      if (i !== undefined) out[i].v += o.total;
    });
    return out.map((o) => ({ ...o, v: Math.round(o.v) }));
  }, [calc.list, range]);
  const peak = series.reduce((m, o, i) => (o.v > series[m].v ? i : m), 0);
  const active = hover ?? peak;

  const products = useStore((s) => s.products);
  const catOf = useMemo(() => new Map(products.map((p) => [p.id, p.category])), [products]);

  const byProduct = useMemo(() => {
    const m = new Map<string, { name: string; category: string; sold: number; revenue: number; profit: number }>();
    calc.list.forEach((o) =>
      o.items.forEach((i) => {
        const cur = m.get(i.productId) ?? { name: `${i.name} ${i.strength}`, category: catOf.get(i.productId) ?? '—', sold: 0, revenue: 0, profit: 0 };
        cur.sold += i.qty;
        cur.revenue += i.qty * i.price;
        cur.profit += i.qty * (i.price - i.cost);
        m.set(i.productId, cur);
      })
    );
    return [...m.values()].sort((a, b) => b.revenue - a.revenue);
  }, [calc.list, catOf]);

  const byCategory = useMemo(() => {
    const m = new Map<string, { category: string; revenue: number; profit: number }>();
    byProduct.forEach((p) => {
      const cur = m.get(p.category) ?? { category: p.category, revenue: 0, profit: 0 };
      cur.revenue += p.revenue;
      cur.profit += p.profit;
      m.set(p.category, cur);
    });
    return [...m.values()].sort((a, b) => b.profit - a.profit);
  }, [byProduct]);

  const exportCsv = () => {
    downloadFile('sales-by-product.csv', toCSV([['Product', 'Category', 'Units sold', 'Revenue (BDT)', 'Profit (BDT)'], ...byProduct.map((p) => [p.name, p.category, p.sold, p.revenue.toFixed(2), p.profit.toFixed(2)])]), 'text/csv');
    toast(t('toast.exported'));
  };

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-full bg-card p-1 text-xs shadow-card">
          {[7, 14, 30].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cn('rounded-full px-4 py-2 font-medium transition', range === r ? 'bg-brand-800 text-white' : 'text-muted hover:text-ink')}>
              {t('last')} {num(r)} {t('days')}
            </button>
          ))}
        </div>
        <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> {t('export')}</button>
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-4 md:overflow-visible">
        <StatCard dark label={t('sales.revenue')} value={calc.cur.revenue} format={(n) => money(n, 0)} icon={<Coins size={19} />} trend={calc.trend.revenue} sub={t('vsPrev')} />
        <StatCard label={t('kpi.profit')} value={calc.cur.profit} format={(n) => money(n, 0)} icon={<TrendingUp size={19} />} iconTone="green" trend={calc.trend.profit} sub={t('vsPrev')} />
        <StatCard label={t('sales.cost')} value={calc.cur.cost} format={(n) => money(n, 0)} icon={<Wallet size={19} />} iconTone="amber" trend={calc.trend.cost} sub={t('vsPrev')} />
        <StatCard label={t('sales.aov')} value={calc.cur.aov} format={(n) => money(n, 0)} icon={<Receipt size={19} />} trend={calc.trend.aov} sub={t('vsPrev')} />
      </div>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold">{t('chart.revenue')}</h2>
        <div className="h-[280px]">
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 38, right: 4, left: -8, bottom: 0 }} onMouseLeave={() => setHover(null)}>
              <defs>
                <pattern id="stripe2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill="#0B4A41" />
                  <rect width="4" height="8" fill="#E2F97E" />
                </pattern>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} interval={range > 14 ? 2 : 0} />
              <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Bar
                dataKey="v"
                animationDuration={700}
                shape={(p: any) => {
                  const { x, y, width, height, index } = p;
                  const bw = Math.min(width, 34);
                  const base = y + height; // x-axis baseline
                  const h = height > 0 ? Math.max(height, bw) : 0; // zero revenue draws no capsule
                  const top = base - h;
                  const bx = x + (width - bw) / 2;
                  const on = index === active;
                  return (
                    <g onMouseEnter={() => setHover(index)} style={{ cursor: 'pointer' }}>
                      {h > 0 && <rect x={bx} y={top} width={bw} height={h} rx={bw / 2} fill={on ? 'url(#stripe2)' : '#0B4A41'} />}
                      {on && (
                        <g>
                          <rect x={bx + bw / 2 - 42} y={top - 38} width={84} height={30} rx={10} fill="rgb(var(--card))" stroke="rgb(var(--line))" />
                          <text x={bx + bw / 2} y={top - 19} textAnchor="middle" fontSize={12} fontWeight={700} fill="rgb(var(--ink))">{money(series[index]?.v ?? 0, 0)}</text>
                        </g>
                      )}
                    </g>
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('sales.byCategory')}</h2>
          <DataTable
            rows={byCategory}
            rowKey={(c) => c.category}
            initialPageSize={5}
            pageSizes={[5, 10]}
            columns={[
              { key: 'c', header: t('col.category'), render: (c) => <span className="font-medium">{c.category}</span> },
              { key: 'r', header: t('sales.revenue'), render: (c) => money(c.revenue, 0) },
              { key: 'p', header: t('kpi.profit'), render: (c) => <span className={c.profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}>{money(c.profit, 0)}</span> },
            ]}
          />
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('topProducts')}</h2>
          <DataTable
            rows={byProduct}
            rowKey={(p) => p.name}
            initialPageSize={5}
            pageSizes={[5, 10]}
            columns={[
              { key: 'n', header: t('col.product'), render: (p) => <span className="font-medium">{p.name}</span> },
              { key: 's', header: t('sold'), render: (p) => num(p.sold) },
              { key: 'r', header: t('sales.revenue'), render: (p) => money(p.revenue, 0) },
              { key: 'p', header: t('kpi.profit'), render: (p) => money(p.profit, 0) },
            ]}
          />
        </section>
      </div>
    </Page>
  );
}
