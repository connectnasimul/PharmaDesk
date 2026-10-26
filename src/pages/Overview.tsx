import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CalendarClock, Plus, ShoppingBag, TrendingUp, Users, Wallet, ScanLine, PackagePlus } from 'lucide-react';
import { useStore } from '../store';
import { useApp } from '../hooks/useApp';
import { Badge, Page, StatCard, toneOf } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { dateKey, dhakaDowHour } from '../lib/format';
import { stockStatus } from '../lib/stock';
import { cn } from '../lib/utils';

const DAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function Overview() {
  const { t, money, num, date } = useApp();
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const [range, setRange] = useState(14);
  const [hover, setHover] = useState<number | null>(null);

  const valid = useMemo(() => orders.filter((o) => o.status !== 'Cancelled'), [orders]);

  const stats = useMemo(() => {
    const todayKey = dateKey(new Date());
    const today = valid.filter((o) => dateKey(new Date(o.date)) === todayKey).reduce((s, o) => s + o.total, 0);
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const cost = valid.reduce((s, o) => s + o.items.reduce((c, i) => c + i.cost * i.qty, 0), 0);
    const dues = orders.filter((o) => o.payStatus === 'Due').reduce((s, o) => s + (o.total - o.paid), 0);
    const st = products.map((p) => stockStatus(p));
    return {
      today,
      profit: revenue - cost,
      low: st.filter((x) => x === 'low' || x === 'out').length,
      expiring: st.filter((x) => x === 'expiring' || x === 'expired').length,
      dues,
    };
  }, [valid, orders, products]);

  const series = useMemo(() => {
    const out: { key: string; label: string; v: number }[] = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      out.push({ key: dateKey(d), label: dateKey(d).slice(8), v: 0 });
    }
    const idx = new Map(out.map((o, i) => [o.key, i]));
    valid.forEach((o) => {
      const i = idx.get(dateKey(new Date(o.date)));
      if (i !== undefined) out[i].v += o.total;
    });
    return out.map((o) => ({ ...o, v: Math.round(o.v) }));
  }, [valid, range]);

  const peak = useMemo(() => series.reduce((m, o, i) => (o.v > series[m].v ? i : m), 0), [series]);
  const active = hover ?? peak;

  const heat = useMemo(() => {
    const grid = Array.from({ length: HOURS.length }, () => Array(7).fill(0) as number[]);
    valid.forEach((o) => {
      const { dow, hour } = dhakaDowHour(new Date(o.date));
      const h = HOURS.indexOf(hour);
      if (h >= 0) grid[h][dow] += 1;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [valid]);

  const top = useMemo(() => {
    const m = new Map<string, { name: string; sold: number; revenue: number }>();
    valid.forEach((o) =>
      o.items.forEach((i) => {
        const cur = m.get(i.productId) ?? { name: `${i.name} ${i.strength}`, sold: 0, revenue: 0 };
        cur.sold += i.qty;
        cur.revenue += i.qty * i.price;
        m.set(i.productId, cur);
      })
    );
    return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [valid]);

  const customersNew = customers.length;

  return (
    <Page>
      {/* KPIs */}
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-6">
        <StatCard dark label={t('kpi.today')} value={stats.today} format={(n) => money(n, 0)} icon={<ShoppingBag size={19} />} trend={8.2} sub={t('sinceLastWeek')} />
        <StatCard label={t('kpi.profit')} value={stats.profit} format={(n) => money(n, 0)} icon={<TrendingUp size={19} />} iconTone="green" trend={5.4} sub={t('sinceLastWeek')} />
        <StatCard label={t('kpi.lowStock')} value={stats.low} format={(n) => num(Math.round(n))} icon={<AlertTriangle size={19} />} iconTone="amber" sub={t('items')} onClick={() => navigate('/products')} />
        <StatCard label={t('kpi.expiring')} value={stats.expiring} format={(n) => num(Math.round(n))} icon={<CalendarClock size={19} />} iconTone="red" sub={t('within90')} onClick={() => navigate('/products')} />
        <StatCard label={t('kpi.customers')} value={customersNew} format={(n) => num(Math.round(n))} icon={<Users size={19} />} />
        <StatCard label={t('kpi.dues')} value={stats.dues} format={(n) => money(n, 0)} icon={<Wallet size={19} />} iconTone="amber" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button className="btn-lime" onClick={() => navigate('/pos')}><ScanLine size={17} /> {t('qa.newSale')}</button>
        <button className="btn-ghost" onClick={() => navigate('/products?new=1')}><PackagePlus size={17} /> {t('qa.addProduct')}</button>
        <button className="btn-ghost" onClick={() => navigate('/orders')}><Plus size={17} /> {t('nav.orders')}</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        {/* Revenue chart */}
        <section className="card p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{t('chart.revenue')}</h2>
            <div className="flex rounded-full bg-soft p-1 text-xs">
              {[7, 14, 30].map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cn('rounded-full px-3 py-1.5 font-medium transition', range === r ? 'bg-brand-800 text-white' : 'text-muted hover:text-ink')}>
                  {num(r)} {t('days')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[290px] w-full">
            <ResponsiveContainer>
              <BarChart data={series} margin={{ top: 38, right: 4, left: -8, bottom: 0 }} onMouseLeave={() => setHover(null)}>
                <defs>
                  <pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="#0B4A41" />
                    <rect width="4" height="8" fill="#E2F97E" />
                  </pattern>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} interval={range > 14 ? 2 : 0} />
                <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                <Tooltip cursor={false} content={() => null} />
                <Bar
                  dataKey="v"
                  isAnimationActive
                  animationDuration={700}
                  background={{ fill: 'transparent' }}
                  shape={(p: any) => {
                    const { x, y, width, height, index, background } = p;
                    const bw = Math.min(width, 34);
                    const bx = x + (width - bw) / 2;
                    const isActive = index === active;
                    const bg = background ?? { y: 0, height: 0 };
                    return (
                      <g onMouseEnter={() => setHover(index)} style={{ cursor: 'pointer' }}>
                        <rect x={bx} y={bg.y} width={bw} height={bg.height} rx={bw / 2} fill="rgb(var(--soft))" opacity={0.7} />
                        <rect x={bx} y={y} width={bw} height={Math.max(height, bw)} rx={bw / 2} fill={isActive ? 'url(#stripe)' : '#0B4A41'} />
                        {isActive && (
                          <g>
                            <rect x={bx + bw / 2 - 42} y={y - 38} width={84} height={30} rx={10} fill="rgb(var(--card))" stroke="rgb(var(--line))" />
                            <text x={bx + bw / 2} y={y - 19} textAnchor="middle" fontSize={12} fontWeight={700} fill="rgb(var(--ink))">{money(series[index]?.v ?? 0, 0)}</text>
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

        {/* Heatmap */}
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('chart.ordersByTime')}</h2>
          <div className="overflow-x-auto">
            <div className="min-w-[280px]">
              <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-1.5">
                <span />
                {DAY_KEYS.map((d) => <span key={d} className="text-center text-[10px] text-muted">{t('day.' + d)}</span>)}
                {HOURS.map((h, r) => (
                  <Fragment key={h}>
                    <span className="self-center text-[10px] text-muted">{num(h > 12 ? h - 12 : h)} {h >= 12 ? 'pm' : 'am'}</span>
                    {heat.grid[r].map((c, i) => (
                      <div
                        key={r + '-' + i}
                        title={`${num(c)} ${t('nav.orders')}`}
                        className="aspect-square rounded-md bg-brand-800 transition-transform hover:scale-110"
                        style={{ opacity: c === 0 ? 0.07 : 0.2 + (c / heat.max) * 0.8 }}
                      />
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('recentOrders')}</h2>
            <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => navigate('/orders')}>{t('viewAll')}</button>
          </div>
          <DataTable
            rows={orders.slice(0, 20)}
            rowKey={(o) => o.id}
            initialPageSize={5}
            pageSizes={[5, 10]}
            columns={[
              { key: 'id', header: t('col.orderId'), render: (o) => <span className="font-medium">#{o.id}</span> },
              { key: 'cust', header: t('col.customer'), render: (o) => o.customerName },
              { key: 'date', header: t('col.date'), render: (o) => <span className="text-muted">{date(o.date)}</span> },
              { key: 'total', header: t('col.total'), render: (o) => money(o.total) },
              { key: 'pay', header: t('col.payment'), render: (o) => <Badge tone={toneOf(o.payStatus)}>{t('s.' + o.payStatus)}</Badge> },
              { key: 'st', header: t('col.status'), render: (o) => <Badge tone={toneOf(o.status)}>{t('s.' + o.status)}</Badge> },
            ]}
          />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('topProducts')}</h2>
          <ul className="space-y-3">
            {top.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-800">{num(i + 1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted">{num(p.sold)} {t('sold')}</div>
                </div>
                <div className="text-sm font-bold">{money(p.revenue, 0)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
