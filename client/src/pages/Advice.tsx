import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bot, CheckCircle2, Sprout } from 'lucide-react';
import { api } from '../lib/api';
import type { AdviceResult, FarmProfile, LandInput, Recommendation } from '../lib/types';
import { fmtNum } from '../lib/format';
import { useMeta } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { RichText } from '../components/RichText';
import { AiOffNote, Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Select, cx } from '../components/ui';

const SUIT_COLOR: Record<string, string> = {
  'Juda mos': 'bg-forest-700 text-cream',
  Mos: 'bg-forest-100 text-forest-900',
  'Shartli mos': 'bg-wheat/30 text-wheat-dark',
  'Tavsiya etilmaydi': 'bg-rose-100 text-rose-800',
};

function RecCard({ r, rank }: { r: Recommendation; rank: number }) {
  return (
    <Card className={cx('flex flex-col gap-4', rank === 0 && 'border-forest-700 ring-2 ring-forest-700/20')}>
      <div className="flex items-start gap-3">
        <span className="text-4xl">{r.emoji}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{r.name}</h3>
            <Badge className={SUIT_COLOR[r.suitability]}>{r.suitability}</Badge>
            {r.secondCrop && <Badge className="bg-sky-100 text-sky-900">Takroriy ekin sifatida</Badge>}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest-50" role="meter" aria-valuenow={r.score} aria-valuemin={0} aria-valuemax={100} aria-label="Moslik">
            <div className="h-full rounded-full bg-forest-700" style={{ width: `${r.score}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">Moslik: {r.score} / 100</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-forest-50 p-3">
          <p className="text-xs text-muted">Taxminiy hosil, 1 ga</p>
          <p className="font-display text-lg font-bold">
            {fmtNum(r.yieldPerHa.min, 1)}–{fmtNum(r.yieldPerHa.max, 1)} t
          </p>
        </div>
        <div className="rounded-xl bg-forest-50 p-3">
          <p className="text-xs text-muted">Butun maydondan</p>
          <p className="font-display text-lg font-bold">
            {fmtNum(r.totalYield.min, 1)}–{fmtNum(r.totalYield.max, 1)} t
          </p>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {r.reasons.map((x) => (
          <li key={x} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest-700" /> {x}
          </li>
        ))}
        {r.warnings.map((x) => (
          <li key={x} className="flex gap-2 text-wheat-dark">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {x}
          </li>
        ))}
      </ul>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="font-semibold">Ekish muddati</dt>
          <dd className="text-muted">{r.plantingTime}</dd>
        </div>
        <div>
          <dt className="font-semibold">O‘g‘it (1 ga)</dt>
          <dd className="text-muted">{r.fertilizerPerHa}</dd>
        </div>
        <div>
          <dt className="font-semibold">Pishish muddati</dt>
          <dd className="text-muted">~{r.growDays} kun</dd>
        </div>
      </dl>
      <Link to={`/ekinlar/${r.slug}`} className="mt-auto text-sm font-semibold text-forest-700 hover:underline">
        To‘liq qo‘llanma →
      </Link>
    </Card>
  );
}

export default function Advice() {
  const meta = useMeta();
  const { user } = useAuth();
  const [form, setForm] = useState({ region: '', district: '', area: '', bonitet: '', water: '2', landType: 'paxta-galla' });
  const [save, setSave] = useState(true);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Kirgan foydalanuvchi uchun saqlangan yer ma'lumotlarini oldindan to'ldiramiz.
  useEffect(() => {
    if (!user) return;
    api
      .get<{ profile: FarmProfile }>('/farm/profile')
      .then(({ profile: p }) =>
        setForm((f) => ({
          region: p.region ?? f.region,
          district: p.district ?? f.district,
          area: p.area ? String(p.area) : f.area,
          bonitet: p.bonitet ? String(p.bonitet) : f.bonitet,
          water: p.water ? String(p.water) : f.water,
          landType: p.landType ?? f.landType,
        })),
      )
      .catch(() => {});
  }, [user]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: LandInput & { saveProfile?: boolean } = {
        region: form.region,
        district: form.district || undefined,
        area: Number(form.area),
        bonitet: Number(form.bonitet),
        water: Number(form.water) as 1 | 2 | 3,
        landType: form.landType as LandInput['landType'],
        saveProfile: Boolean(user) && save,
      };
      setResult(await api.post<AdviceResult>('/advice', body));
      setTimeout(() => document.getElementById('natija')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const good = result?.recommendations.filter((r) => r.score >= 45) ?? [];
  const rest = result?.recommendations.filter((r) => r.score < 45) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="1-bo‘lim · AI agro maslahat" title="Yeringizga nima ekish kerak?">
        Yer ma’lumotlarini kiriting — tizim har bir ekinni hududingiz, ball bonitet va suv ta’minotiga qarab baholaydi.
      </PageHeader>

      <Card className="mb-10">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Viloyat">
            <Select required value={form.region} onChange={set('region')}>
              <option value="">Tanlang…</option>
              {meta?.regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tuman" hint="Masalan: Sardoba">
            <Input value={form.district} onChange={set('district')} maxLength={80} placeholder="Tuman nomi" />
          </Field>
          <Field label="Yer maydoni (gektar)">
            <Input required type="number" inputMode="decimal" min="0.01" step="0.01" value={form.area} onChange={set('area')} placeholder="20" />
          </Field>
          <Field label="Ball bonitet" hint="Yer kadastri hujjatida ko‘rsatilgan (1–100)">
            <Input required type="number" inputMode="numeric" min="1" max="100" value={form.bonitet} onChange={set('bonitet')} placeholder="60" />
          </Field>
          <Field label="Suv bilan ta’minlanganlik">
            <Select value={form.water} onChange={set('water')}>
              {meta?.waterLevels.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Yer turi">
            <Select value={form.landType} onChange={set('landType')}>
              {meta?.landTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center lg:col-span-3">
            <Button type="submit" loading={loading} className="sm:w-auto">
              <Sprout className="size-4" /> Maslahat olish
            </Button>
            {user ? (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="size-4 accent-forest-700" />
                Yer ma’lumotlarini kabinetga saqlash
              </label>
            ) : (
              <p className="text-sm text-muted">
                <Link to="/royxatdan-otish" className="font-semibold text-forest-700 underline">
                  Ro‘yxatdan o‘ting
                </Link>{' '}
                — ma’lumotlaringiz saqlanadi va signallar keladi.
              </p>
            )}
          </div>
        </form>
      </Card>

      {error && <ErrorBox message={error} />}

      {result && (
        <div id="natija" className="scroll-mt-24 space-y-6">
          <h2 className="text-2xl font-bold">Natija</h2>
          {result.aiSummary ? (
            <Card className="border-forest-700/30 bg-forest-50">
              <p className="mb-2 flex items-center gap-2 font-semibold text-forest-900">
                <Bot className="size-5" /> AgroAI maslahati
              </p>
              <RichText text={result.aiSummary} />
            </Card>
          ) : (
            !result.aiEnabled && <AiOffNote />
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {good.map((r, i) => (
              <RecCard key={r.slug} r={r} rank={i} />
            ))}
          </div>
          {good.length === 0 && <ErrorBox message="Bu sharoit uchun mos ekin topilmadi. Suv ta’minoti yoki yer turini o‘zgartirib ko‘ring, yoki agronom bilan maslahatlashing." />}
          {rest.length > 0 && (
            <details className="rounded-2xl border border-line bg-paper p-4">
              <summary className="cursor-pointer font-semibold">Tavsiya etilmaydigan ekinlar ({rest.length})</summary>
              <ul className="mt-3 space-y-1 text-sm">
                {rest.map((r) => (
                  <li key={r.slug}>
                    {r.emoji} <b>{r.name}</b> — {r.warnings.join('; ')}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="text-xs text-muted">Hosil ko‘rsatkichlari o‘rtacha me’yorlar asosida taxminiy hisoblangan. Aniq natija nav, agrotexnika va ob-havoga bog‘liq.</p>
        </div>
      )}
    </div>
  );
}
