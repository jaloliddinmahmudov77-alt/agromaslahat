import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { CropListItem } from '../lib/types';
import { WATER_LABEL, fmtNum } from '../lib/format';
import { ErrorBox, Input, PageHeader, Spinner, cx } from '../components/ui';

export default function Crops() {
  const { data, error, loading, reload } = useApi<{ crops: CropListItem[] }>('/crops');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const crops = data?.crops ?? [];
  const categories = [...new Set(crops.map((c) => c.category))];
  const shown = crops.filter((c) => (!cat || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="2-bo‘lim · Qishloq xo‘jaligi mahsulotlari" title="Ekinlar qo‘llanmasi">
        Har bir ekin bo‘yicha: gektaridan hosil, ekish, sug‘orish va yig‘im muddatlari, o‘g‘it me’yori va agrotadbirlar.
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ekin qidirish…" className="pl-9" aria-label="Ekin qidirish" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['', ...categories].map((c) => (
            <button
              key={c || 'all'}
              onClick={() => setCat(c)}
              className={cx('rounded-full px-3 py-1.5 text-sm font-semibold', cat === c ? 'bg-forest-900 text-cream' : 'bg-paper text-ink ring-1 ring-line hover:bg-forest-50')}
            >
              {c || 'Barchasi'}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <Link key={c.slug} to={`/ekinlar/${c.slug}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{c.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <p className="text-xs text-muted">{c.category}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted">{c.summary}</p>
            <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-forest-50 p-2">
                <p className="font-bold">
                  {fmtNum(c.yieldMinT)}–{fmtNum(c.yieldMaxT)} t
                </p>
                <p className="text-muted">1 gektardan</p>
              </div>
              <div className="rounded-lg bg-forest-50 p-2">
                <p className="font-bold">~{c.growDays} kun</p>
                <p className="text-muted">pishish</p>
              </div>
              <div className="rounded-lg bg-forest-50 p-2">
                <p className="font-bold">{WATER_LABEL[c.waterNeed]}</p>
                <p className="text-muted">talab</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!loading && data && shown.length === 0 && <p className="py-8 text-center text-muted">Hech narsa topilmadi.</p>}
    </div>
  );
}
