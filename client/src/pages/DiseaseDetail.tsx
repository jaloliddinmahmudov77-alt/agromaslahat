import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, PhoneCall } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { Disease } from '../lib/types';
import { FavoriteButton } from '../components/FavoriteButton';
import { Badge, Card, ErrorBox, Spinner } from '../components/ui';

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <Card>
      <h2 className={`mb-3 text-lg font-semibold ${tone}`}>{title}</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function DiseaseDetail() {
  const { slug } = useParams();
  const { data, error, loading } = useApi<{ disease: Disease; crops: { slug: string; name: string; emoji: string }[] }>(`/diseases/${slug}`);
  if (loading) return <Spinner />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBox message={error ?? 'Topilmadi'} />
      </div>
    );
  const { disease: d, crops } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/kasalliklar" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
        <ArrowLeft className="size-4" /> Kasalliklar ro‘yxati
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="text-6xl">{d.kind === 'zararkunanda' ? '🐛' : '🍂'}</span>
        <div className="flex-1">
          <Badge className={d.kind === 'zararkunanda' ? 'bg-amber-100 text-amber-900' : 'bg-rose-100 text-rose-900'}>{d.kind}</Badge>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{d.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {crops.map((c) => (
              <Link key={c.slug} to={`/ekinlar/${c.slug}`} className="rounded-full bg-forest-50 px-3 py-1 text-sm font-semibold hover:bg-forest-100">
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>
        <FavoriteButton kind="disease" slug={d.slug} title={d.name} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Belgilari" items={d.symptoms} tone="text-rose-800" />
        <ListCard title="Sabablari" items={d.causes} tone="text-wheat-dark" />
        <ListCard title="Oldini olish" items={d.prevention} tone="text-forest-700" />
        <ListCard title="Xavfsiz parvarish choralari" items={d.safeCare} tone="text-forest-900" />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-wheat/50 bg-wheat/10 p-5">
        <PhoneCall className="mt-0.5 size-5 shrink-0 text-wheat-dark" />
        <div>
          <p className="font-semibold">Qachon mutaxassisga murojaat qilish kerak</p>
          <p className="text-muted">{d.whenExpert}</p>
        </div>
      </div>

      <Link to="/kasalliklar/tashxis" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-forest-900 px-5 py-3 font-semibold text-cream">
        <Camera className="size-4" /> O‘simligingiz rasmini tekshirish
      </Link>
    </div>
  );
}
