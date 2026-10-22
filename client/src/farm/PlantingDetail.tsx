import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Expense, Planting, Reminder, Report } from '../lib/types';
import { daysUntil, fmtDate, fmtNum, fmtShortDate, fmtSum, toInputDate } from '../lib/format';
import { useApi, useMeta } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { RichText } from '../components/RichText';
import { Badge, Button, Card, ErrorBox, Field, Input, NeedLogin, Select, Spinner, cx } from '../components/ui';
import { ReminderList } from './ReminderList';

interface Detail {
  planting: Planting & { expenses: Expense[] };
  crop: { slug: string; name: string; emoji: string; growDays: number; yieldMinT: number; yieldMaxT: number } | null;
  reminders: Reminder[];
  report: Report;
}

function ExpenseForm({ plantingId, onDone }: { plantingId: string; onDone: () => void }) {
  const meta = useMeta();
  const [form, setForm] = useState({ category: 'urug', amount: '', spentAt: toInputDate(), note: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/farm/plantings/${plantingId}/expenses`, { ...form, amount: Number(form.amount), note: form.note || undefined });
      setForm({ ...form, amount: '', note: '' });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <Field label="Toifa">
        <Select value={form.category} onChange={set('category')}>
          {meta?.expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Summa (so‘m)">
        <Input required type="number" inputMode="numeric" min="1" value={form.amount} onChange={set('amount')} />
      </Field>
      <Field label="Sana">
        <Input required type="date" value={form.spentAt} onChange={set('spentAt')} />
      </Field>
      <Field label="Izoh">
        <Input value={form.note} onChange={set('note')} maxLength={300} />
      </Field>
      <Button type="submit" loading={loading}>
        Qo‘shish
      </Button>
      {error && (
        <div className="sm:col-span-2 lg:col-span-5">
          <ErrorBox message={error} />
        </div>
      )}
    </form>
  );
}

function HarvestForm({ p, onDone }: { p: Planting; onDone: () => void }) {
  const [form, setForm] = useState({
    harvestKg: p.harvestKg?.toString() ?? '',
    revenue: p.revenue?.toString() ?? '',
    taxPaid: p.taxPaid?.toString() ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const num = (s: string) => (s === '' ? null : Number(s));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/farm/plantings/${p.id}`, { harvestKg: num(form.harvestKg), revenue: num(form.revenue), taxPaid: num(form.taxPaid), status: 'harvested' });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <Field label="Olingan hosil (kg)">
        <Input required type="number" inputMode="decimal" min="0" value={form.harvestKg} onChange={set('harvestKg')} />
      </Field>
      <Field label="Sotuvdan daromad (so‘m)">
        <Input required type="number" inputMode="numeric" min="0" value={form.revenue} onChange={set('revenue')} />
      </Field>
      <Field label="To‘langan soliq (so‘m)">
        <Input type="number" inputMode="numeric" min="0" value={form.taxPaid} onChange={set('taxPaid')} />
      </Field>
      <div className="sm:col-span-3">
        {error && <ErrorBox message={error} />}
        <Button type="submit" variant="accent" loading={loading} className="mt-1">
          {p.status === 'harvested' ? 'Yangilash' : 'Hosilni yakunlash'}
        </Button>
      </div>
    </form>
  );
}

function ReportCard({ id, r, status, categories }: { id: string; r: Report; status: Planting['status']; categories: Record<string, string> }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxCat = Math.max(1, ...Object.values(r.byCategory));

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      setAnalysis((await api.post<{ analysis: string }>(`/farm/plantings/${id}/analysis`)).analysis);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const rows: [string, string, boolean?][] = [
    ['Olingan hosil', `${fmtNum(r.harvestT, 2)} t (${fmtNum(r.yieldPerHa, 2)} t/ga)`],
    ['Xarajatlar', fmtSum(r.totalCost)],
    ['Daromad', fmtSum(r.revenue)],
    ['Soliq', fmtSum(r.tax)],
    ['Sof foyda', fmtSum(r.net), true],
  ];

  return (
    <Card className="bg-forest-900 text-cream">
      <h2 className="mb-4 text-lg font-semibold text-wheat">Mavsum hisoboti</h2>
      <dl className="divide-y divide-forest-800">
        {rows.map(([k, v, strong]) => (
          <div key={k} className="flex justify-between gap-4 py-2">
            <dt className="text-forest-100">{k}</dt>
            <dd className={cx('text-right tabular-nums', strong && 'font-display text-lg font-bold', strong && r.net < 0 && 'text-rose-300')}>{v}</dd>
          </div>
        ))}
      </dl>
      {r.costPerKg !== null && <p className="mt-2 text-sm text-forest-100">1 kg tannarxi: {fmtSum(r.costPerKg)}</p>}
      {Object.keys(r.byCategory).length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">Xarajatlar tarkibi</p>
          {Object.entries(r.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-xs text-forest-100">
                  <span>{categories[k] ?? k}</span>
                  <span>{fmtSum(v)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-forest-800">
                  <div className="h-full rounded-full bg-wheat" style={{ width: `${(v / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      )}
      <p className="mt-4 rounded-xl bg-forest-800 p-3 text-sm">{r.verdict}</p>
      {status === 'harvested' && (
        <div className="mt-4">
          {analysis ? (
            <div className="rounded-xl bg-paper p-4 text-ink">
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <Bot className="size-5 text-forest-700" /> AI tahlili
              </p>
              <RichText text={analysis} />
            </div>
          ) : (
            <Button variant="accent" onClick={analyze} loading={loading}>
              <Bot className="size-4" /> AI tahlili: keyingi mavsumda nima ekish kerak?
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </div>
      )}
    </Card>
  );
}

export default function PlantingDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi<Detail>(user ? `/farm/plantings/${id}` : null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setReminders(data?.reminders ?? []), [data]);

  if (authLoading) return <Spinner />;
  if (!user)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <NeedLogin what="Kabinet" />
      </div>
    );
  if (loading && !data) return <Spinner />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBox message={error ?? 'Topilmadi'} />
      </div>
    );

  const { planting: p, crop, report } = data;
  const categories = Object.fromEntries((meta?.expenseCategories ?? []).map((c) => [c.id, c.name]));
  const day = -daysUntil(p.plantedAt);
  const visible = showAll ? reminders : reminders.filter((r) => !r.done).slice(0, 8);

  async function remove() {
    if (!confirm(`“${p.cropName}” yozuvi va unga tegishli xarajatlar o‘chirilsinmi?`)) return;
    await api.del(`/farm/plantings/${p.id}`);
    navigate('/kabinet?tab=ekinlar');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/kabinet?tab=ekinlar" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
        <ArrowLeft className="size-4" /> Ekinlarim
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="text-6xl">{crop?.emoji ?? '🌱'}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{p.cropName}</h1>
            <Badge className={p.status === 'harvested' ? 'bg-wheat/30 text-wheat-dark' : undefined}>{p.status === 'harvested' ? 'Yig‘ilgan' : 'O‘smoqda'}</Badge>
          </div>
          <p className="text-muted">
            {fmtNum(p.area, 2)} ga · ekilgan: {fmtDate(p.plantedAt)}
            {p.status === 'active' && crop && day >= 0 && ` · ${day}-kun / ~${crop.growDays}`}
          </p>
          {crop && (
            <p className="text-sm text-muted">
              Kutilayotgan hosil: {fmtNum(crop.yieldMinT * p.area, 1)}–{fmtNum(crop.yieldMaxT * p.area, 1)} t
            </p>
          )}
        </div>
        <Button variant="danger" onClick={remove}>
          <Trash2 className="size-4" /> O‘chirish
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Parvarish taqvimi</h2>
              <button onClick={() => setShowAll(!showAll)} className="text-sm font-semibold text-forest-700 hover:underline">
                {showAll ? 'Faqat navbatdagilar' : `Hammasi (${reminders.length})`}
              </button>
            </div>
            {visible.length ? (
              <ReminderList reminders={visible} onChange={(r) => setReminders((l) => l.map((x) => (x.id === r.id ? r : x)))} />
            ) : (
              <p className="py-4 text-sm text-muted">Barcha ishlar bajarilgan.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Xarajatlar</h2>
            <ExpenseForm plantingId={p.id} onDone={reload} />
            {p.expenses.length > 0 && (
              <ul className="mt-4 divide-y divide-line">
                {p.expenses.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-16 text-muted">{fmtShortDate(e.spentAt)}</span>
                    <span className="flex-1">
                      <b>{categories[e.category] ?? e.category}</b>
                      {e.note && <span className="text-muted"> — {e.note}</span>}
                    </span>
                    <span className="font-semibold tabular-nums">{fmtSum(e.amount)}</span>
                    <button onClick={() => api.del(`/farm/expenses/${e.id}`).then(reload)} className="p-1 text-muted hover:text-rose-700" aria-label="Xarajatni o‘chirish">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 text-lg font-semibold">Hosil va daromad</h2>
            <p className="mb-4 text-sm text-muted">Hosil yig‘ilgach kiriting — tizim sof foydani hisoblaydi.</p>
            <HarvestForm p={p} onDone={reload} />
          </Card>
        </div>

        <div>
          <ReportCard id={p.id} r={report} status={p.status} categories={categories} />
        </div>
      </div>
    </div>
  );
}
