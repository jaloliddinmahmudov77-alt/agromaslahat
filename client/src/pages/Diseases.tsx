import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { CropListItem, DiseaseListItem } from '../lib/types';
import { ErrorBox, Input, PageHeader, Select, Spinner, cx } from '../components/ui';

export default function Diseases() {
  const [kind, setKind] = useState('');
  const [crop, setCrop] = useState('');
  const [q, setQ] = useState('');
  const params = new URLSearchParams({ ...(kind && { kind }), ...(crop && { crop }) });
  const { data, error, loading, reload } = useApi<{ diseases: DiseaseListItem[] }>(`/diseases?${params}`);
  const crops = useApi<{ crops: CropListItem[] }>('/crops').data?.crops ?? [];
  const cropName = (slug: string) => crops.find((c) => c.slug === slug);
  const shown = (data?.diseases ?? []).filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="4-bo‘lim · Kasalliklar" title="Kasallik va zararkunandalar">
        Belgilari, sabablari, oldini olish va xavfsiz parvarish choralari.
      </PageHeader>

      <Link to="/kasalliklar/tashxis" className="mb-8 flex flex-col gap-4 rounded-2xl bg-forest-900 p-6 text-cream sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-wheat text-ink">
          <Camera className="size-7" />
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Barg rasmini yuklang — AI tashxis qo‘yadi</h2>
          <p className="text-forest-100">Telefoningizdan rasm oling: sun’iy intellekt kasallikni aniqlaydi va suv, o‘g‘it, himoya bo‘yicha maslahat beradi.</p>
        </div>
        <span className="rounded-xl bg-wheat px-4 py-2 text-center font-semibold text-ink">Tashxis qo‘yish</span>
      </Link>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" className="pl-9" aria-label="Kasallik qidirish" />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Turi">
          <option value="">Barcha turlar</option>
          <option value="kasallik">Kasalliklar</option>
          <option value="zararkunanda">Zararkunandalar</option>
        </Select>
        <Select value={crop} onChange={(e) => setCrop(e.target.value)} aria-label="Ekin">
          <option value="">Barcha ekinlar</option>
          {crops.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.emoji} {c.name}
            </option>
          ))}
        </Select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((d) => (
          <Link key={d.slug} to={`/kasalliklar/${d.slug}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <span className={cx('grid size-11 place-items-center rounded-xl text-2xl', d.kind === 'zararkunanda' ? 'bg-amber-100' : 'bg-rose-100')}>{d.kind === 'zararkunanda' ? '🐛' : '🍂'}</span>
              <div>
                <h2 className="font-semibold">{d.name}</h2>
                <p className="text-xs text-muted capitalize">{d.kind}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted">{d.symptoms[0]}</p>
            <p className="mt-auto text-sm">{d.crops.map((s) => cropName(s)?.emoji ?? '').join(' ')}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
