import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bug, CalendarDays, Droplets, FlaskConical, Layers, Tractor, Wheat } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApi, useMeta } from '../hooks/useApi';
import type { Crop } from '../lib/types';
import { REMINDER_TYPES, WATER_LABEL, fmtNum } from '../lib/format';
import { FavoriteButton } from '../components/FavoriteButton';
import { Badge, Card, ErrorBox, Spinner } from '../components/ui';

function Info({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <span className="text-forest-700">{icon}</span>
        {title}
      </h2>
      <div className="text-muted">{children}</div>
    </Card>
  );
}

export default function CropDetail() {
  const { slug } = useParams();
  const meta = useMeta();
  const { data, error, loading } = useApi<{ crop: Crop; related: { slug: string; name: string; kind: string }[] }>(`/crops/${slug}`);

  if (loading) return <Spinner />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBox message={error ?? 'Topilmadi'} />
      </div>
    );
  const { crop, related } = data;
  const regionNames = meta ? crop.regions.map((id) => meta.regions.find((r) => r.id === id)?.name ?? id) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/ekinlar" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
        <ArrowLeft className="size-4" /> Barcha ekinlar
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="text-6xl">{crop.emoji}</span>
        <div className="flex-1">
          <Badge>{crop.category}</Badge>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{crop.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{crop.summary}</p>
        </div>
        <FavoriteButton kind="crop" slug={crop.slug} title={crop.name} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['1 gektardan hosil', `${fmtNum(crop.yieldMinT)}–${fmtNum(crop.yieldMaxT)} t`],
          ['Pishish muddati', `~${crop.growDays} kun`],
          ['Suvga talab', WATER_LABEL[crop.waterNeed]],
          ['Ball bonitet', `${crop.minBonitet}+ ball`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-forest-900 p-4 text-cream">
            <p className="text-xs text-forest-100">{k}</p>
            <p className="font-display text-xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Info icon={<CalendarDays className="size-5" />} title="Ekish muddati">
          {crop.plantingTime}
        </Info>
        <Info icon={<Wheat className="size-5" />} title="Hosil yig‘ish">
          {crop.harvest}
        </Info>
        <Info icon={<Droplets className="size-5" />} title="Sug‘orish">
          {crop.irrigation}
        </Info>
        <Info icon={<FlaskConical className="size-5" />} title="O‘g‘itlash">
          <p>{crop.fertilizing}</p>
          <p className="mt-2 rounded-lg bg-forest-50 px-3 py-2 text-sm font-semibold text-ink">1 ga: {crop.fertilizerPerHa}</p>
        </Info>
        <Info icon={<Layers className="size-5" />} title="Tuproq">
          {crop.soil}
        </Info>
        <Info icon={<Tractor className="size-5" />} title="Agrotadbirlar">
          <ul className="list-disc space-y-1 pl-5">
            {crop.agroWorks.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Info>
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 text-lg font-semibold">Parvarish taqvimi (ekilgan kundan boshlab)</h2>
        <ol className="relative space-y-3 border-l-2 border-forest-100 pl-5">
          {[...crop.careStages]
            .sort((a, b) => a.day - b.day)
            .map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[27px] size-3 rounded-full bg-forest-700" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 text-sm font-bold">{s.day}-kun</span>
                  <Badge className={REMINDER_TYPES[s.type]?.color}>{REMINDER_TYPES[s.type]?.label ?? s.type}</Badge>
                  <span>{s.title}</span>
                </div>
              </li>
            ))}
        </ol>
        <p className="mt-4 text-sm text-muted">Bu ekinni kabinetingizga qo‘shsangiz, shu taqvim asosida eslatma va signallar keladi.</p>
      </Card>

      {related.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Bug className="size-5 text-forest-700" /> Kasallik va zararkunandalar
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((d) => (
              <Link key={d.slug} to={`/kasalliklar/${d.slug}`} className="rounded-full bg-forest-50 px-3 py-1.5 text-sm font-semibold hover:bg-forest-100">
                {d.kind === 'zararkunanda' ? '🐛' : '🍂'} {d.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {regionNames.length > 0 && <p className="mt-6 text-sm text-muted">Yetishtiriladigan hududlar: {regionNames.join(', ')}.</p>}
    </div>
  );
}
