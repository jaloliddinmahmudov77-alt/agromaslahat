import { useMemo, useState } from 'react';
import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { PriceRow } from '../lib/types';
import { fmtDate, fmtNum, fmtShortDate } from '../lib/format';
import { Card, Empty, ErrorBox, PageHeader, Select, Spinner, cx } from '../components/ui';

interface PricesResponse {
  date: string | null;
  rows: PriceRow[];
  products: string[];
  markets: string[];
  sources: string[];
}

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted">—</span>;
  const up = pct > 0.5;
  const down = pct < -0.5;
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold', up && 'text-rose-700', down && 'text-forest-700', !up && !down && 'text-muted')}>
      {up && <TrendingUp className="size-3.5" />}
      {down && <TrendingDown className="size-3.5" />}
      {pct > 0 ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

function History({ product }: { product: string }) {
  const { data } = useApi<{ history: PriceRow[] }>(`/prices/history?product=${encodeURIComponent(product)}`);
  const series = useMemo(() => {
    const byDay = new Map<string, number[]>();
    for (const r of data?.history ?? []) {
      const k = r.recordedAt.slice(0, 10);
      byDay.set(k, [...(byDay.get(k) ?? []), r.price]);
    }
    return [...byDay.entries()].map(([d, v]) => ({ d, avg: v.reduce((s, x) => s + x, 0) / v.length }));
  }, [data]);
  if (series.length < 2) return null;
  const min = Math.min(...series.map((s) => s.avg));
  const max = Math.max(...series.map((s) => s.avg));
  const W = 600;
  const H = 140;
  const pts = series.map((s, i) => [(i / (series.length - 1)) * W, H - 10 - ((s.avg - min) / (max - min || 1)) * (H - 20)] as const);
  const last = series[series.length - 1]!;
  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold">{product}: barcha bozorlar bo‘yicha o‘rtacha narx</h3>
        <span className="font-display text-lg font-bold">{fmtNum(last.avg)} so‘m</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label={`${product} narxi dinamikasi`}>
        <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2c7a3f" strokeWidth="3" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#2c7a3f" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>{fmtShortDate(series[0]!.d)}</span>
        <span>
          {fmtNum(min)} – {fmtNum(max)} so‘m
        </span>
        <span>{fmtShortDate(last.d)}</span>
      </div>
    </Card>
  );
}

export default function Prices() {
  const { data, error, loading, reload } = useApi<PricesResponse>('/prices');
  const [product, setProduct] = useState('');

  const matrix = useMemo(() => {
    const m = new Map<string, Map<string, PriceRow>>();
    for (const r of data?.rows ?? []) {
      if (!m.has(r.product)) m.set(r.product, new Map());
      m.get(r.product)!.set(r.market, r);
    }
    return m;
  }, [data]);

  const products = product ? [product] : (data?.products ?? []);
  const isDemo = data?.sources.includes('demo');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="3-bo‘lim · Bozor narxlari" title="Bugungi bozor narxlari">
        Asosiy bozorlarda qishloq xo‘jaligi mahsulotlarining 1 kg uchun narxi va oxirgi 7 kundagi o‘zgarishi.
      </PageHeader>

      {isDemo && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-wheat/50 bg-wheat/10 p-4 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-wheat-dark" />
          <p>
            <b>Namuna ma’lumotlar.</b> Hozircha jadvalda interfeysni ko‘rsatish uchun namuna narxlar turibdi. Narx platformasi bilan integratsiya ulangach (serverda <code className="rounded bg-white px-1">PRICE_FEED_URL</code>), haqiqiy narxlar har soatda yangilanadi.
          </p>
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.rows.length === 0 && <Empty title="Narxlar hali kiritilmagan" />}

      {data && data.rows.length > 0 && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Sana: {data.date ? fmtDate(data.date) : '—'}</p>
            <Select value={product} onChange={(e) => setProduct(e.target.value)} className="sm:w-60" aria-label="Mahsulot">
              <option value="">Barcha mahsulotlar</option>
              {data.products.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-forest-900 text-left text-cream">
                  <th className="px-4 py-3 font-semibold">Mahsulot (1 kg)</th>
                  {data.markets.map((m) => (
                    <th key={m} className="px-4 py-3 text-right font-semibold">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p} className={i % 2 ? 'bg-forest-50' : ''}>
                    <td className="px-4 py-3 font-semibold">{p}</td>
                    {data.markets.map((m) => {
                      const r = matrix.get(p)?.get(m);
                      return (
                        <td key={m} className="px-4 py-3 text-right">
                          {r ? (
                            <>
                              <p className="font-semibold tabular-nums">{fmtNum(r.price)}</p>
                              <Change pct={r.changePct} />
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Narxlar so‘mda. O‘zgarish — 7 kun oldingiga nisbatan. Manba: {data.sources.map((s) => (s === 'demo' ? 'namuna' : s)).join(', ')}.</p>
          {product && (
            <div className="mt-6">
              <History product={product} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
