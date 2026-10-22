import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Bell, CalendarCheck, Heart, LandPlot, Plus, Sprout, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import type { CropListItem, Favorite, FarmProfile, Notification, PlantingListItem, Reminder, Weather } from '../lib/types';
import { daysUntil, fmtDate, fmtNum, fmtSum, relDay, toInputDate } from '../lib/format';
import { useApi, useMeta } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { WeatherStrip } from '../components/WeatherStrip';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, NeedLogin, Select, Spinner, cx } from '../components/ui';
import { ReminderList } from './ReminderList';

const TABS = [
  { id: 'umumiy', label: 'Umumiy' },
  { id: 'ekinlar', label: 'Ekinlarim' },
  { id: 'yer', label: 'Yer ma’lumotlari' },
  { id: 'eslatmalar', label: 'Eslatmalar' },
  { id: 'bildirishnomalar', label: 'Bildirishnomalar' },
  { id: 'saqlangan', label: 'Saqlanganlar' },
] as const;
type Tab = (typeof TABS)[number]['id'];

interface Signals {
  profile: FarmProfile;
  upcoming: Reminder[];
  weather: Weather | null;
  alerts: string[];
}
interface Summary {
  active: number;
  harvested: number;
  area: number;
  totalCost: number;
  revenue: number;
  net: number;
}

function Overview({ go }: { go: (t: Tab) => void }) {
  const signals = useApi<Signals>('/farm/signals');
  const summary = useApi<Summary>('/farm/summary');
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  useEffect(() => setUpcoming(signals.data?.upcoming ?? []), [signals.data]);

  if (signals.loading) return <Spinner />;
  if (signals.error) return <ErrorBox message={signals.error} onRetry={signals.reload} />;
  const s = signals.data!;
  const sum = summary.data;

  return (
    <div className="space-y-6">
      {!s.profile.region && (
        <Card className="flex flex-col gap-3 border-wheat/50 bg-wheat/10 sm:flex-row sm:items-center">
          <LandPlot className="size-8 text-wheat-dark" />
          <p className="flex-1">Hududingizni va yer ma’lumotlaringizni kiriting — ob-havo signallari va aniqroq maslahat olasiz.</p>
          <Button variant="accent" onClick={() => go('yer')}>
            Kiritish
          </Button>
        </Card>
      )}

      {sum && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Faol ekinlar', `${sum.active} ta`, `${fmtNum(sum.area, 2)} ga`],
            ['Yig‘ilgan', `${sum.harvested} ta`, 'mavsum'],
            ['Xarajatlar', fmtSum(sum.totalCost), 'jami'],
            ['Sof foyda', fmtSum(sum.net), 'yig‘ilganlar bo‘yicha'],
          ].map(([k, v, h]) => (
            <div key={k} className="rounded-2xl bg-forest-900 p-4 text-cream">
              <p className="text-xs text-forest-100">{k}</p>
              <p className="font-display text-lg font-bold break-words sm:text-xl">{v}</p>
              <p className="text-xs text-forest-100">{h}</p>
            </div>
          ))}
        </div>
      )}

      {s.alerts.length > 0 && (
        <Card className="border-wheat bg-wheat/10">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-5 text-wheat-dark" /> AI signallari
          </h2>
          <ul className="space-y-1.5">
            {s.alerts.map((a) => (
              <li key={a}>⚡ {a}</li>
            ))}
          </ul>
        </Card>
      )}

      {s.weather && (
        <Card>
          <WeatherStrip weather={s.weather} />
        </Card>
      )}

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarCheck className="size-5 text-forest-700" /> Yaqin 14 kundagi ishlar
          </h2>
          <button onClick={() => go('eslatmalar')} className="text-sm font-semibold text-forest-700 hover:underline">
            Barchasi
          </button>
        </div>
        {upcoming.length ? (
          <ReminderList reminders={upcoming} onChange={(r) => setUpcoming((list) => list.map((x) => (x.id === r.id ? r : x)))} />
        ) : (
          <p className="py-4 text-sm text-muted">
            Yaqin kunlarda rejalashtirilgan ish yo‘q.{' '}
            <button onClick={() => go('ekinlar')} className="font-semibold text-forest-700 underline">
              Ekin qo‘shing
            </button>{' '}
            — parvarish taqvimi avtomatik tuziladi.
          </p>
        )}
      </Card>
    </div>
  );
}

function AddPlanting({ onDone }: { onDone: () => void }) {
  const crops = useApi<{ crops: CropListItem[] }>('/crops').data?.crops ?? [];
  const [form, setForm] = useState({ cropSlug: '', area: '', plantedAt: toInputDate(), note: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/farm/plantings', { ...form, area: Number(form.area), note: form.note || undefined });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-semibold">Yangi ekin qo‘shish</h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Ekin">
          <Select required value={form.cropSlug} onChange={set('cropSlug')}>
            <option value="">Tanlang…</option>
            {crops.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Maydon (ga)">
          <Input required type="number" inputMode="decimal" min="0.01" step="0.01" value={form.area} onChange={set('area')} />
        </Field>
        <Field label="Ekilgan sana">
          <Input required type="date" value={form.plantedAt} onChange={set('plantedAt')} />
        </Field>
        <Field label="Izoh">
          <Input value={form.note} onChange={set('note')} maxLength={500} placeholder="Nav, kontur raqami…" />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          {error && <ErrorBox message={error} />}
          <Button type="submit" loading={loading} className="mt-2">
            <Plus className="size-4" /> Qo‘shish va taqvim tuzish
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Plantings() {
  const { data, error, loading, reload } = useApi<{ plantings: PlantingListItem[] }>('/farm/plantings');
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ekinlarim</h2>
        <Button variant={adding ? 'secondary' : 'primary'} onClick={() => setAdding(!adding)}>
          {adding ? 'Bekor qilish' : (
            <>
              <Plus className="size-4" /> Ekin qo‘shish
            </>
          )}
        </Button>
      </div>
      {adding && (
        <AddPlanting
          onDone={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.plantings.length === 0 && !adding && (
        <Empty title="Hali ekin qo‘shilmagan" icon={<Sprout className="size-10" />}>
          Ekkan ekiningizni qo‘shing: tizim parvarish taqvimini tuzadi, signallar yuboradi va xarajat-daromadni hisoblaydi.
        </Empty>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.plantings.map((p) => {
          const day = -daysUntil(p.plantedAt);
          const pct = p.growDays ? Math.max(0, Math.min(100, (day / p.growDays) * 100)) : 0;
          return (
            <Link key={p.id} to={`/kabinet/ekin/${p.id}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 transition hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{p.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{p.cropName}</h3>
                  <p className="text-sm text-muted">
                    {fmtNum(p.area, 2)} ga · {fmtDate(p.plantedAt)}
                  </p>
                </div>
                <Badge className={p.status === 'harvested' ? 'bg-wheat/30 text-wheat-dark' : undefined}>{p.status === 'harvested' ? 'Yig‘ilgan' : 'O‘smoqda'}</Badge>
              </div>
              {p.status === 'active' && p.growDays && (
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-forest-50">
                    <div className="h-full rounded-full bg-forest-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{day < 0 ? `Ekishga ${-day} kun` : `${day}-kun / ~${p.growDays} kun`}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-forest-50 p-2">
                  <p className="text-xs text-muted">Xarajat</p>
                  <p className="font-semibold">{fmtSum(p.report.totalCost)}</p>
                </div>
                <div className="rounded-lg bg-forest-50 p-2">
                  <p className="text-xs text-muted">Sof foyda</p>
                  <p className={cx('font-semibold', p.status === 'harvested' && p.report.net < 0 && 'text-rose-700')}>{p.status === 'harvested' ? fmtSum(p.report.net) : '—'}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ProfileForm() {
  const meta = useMeta();
  const { refresh } = useAuth();
  const { data, loading } = useApi<{ profile: FarmProfile }>('/farm/profile');
  const [form, setForm] = useState({ region: '', district: '', area: '', bonitet: '', water: '2', landType: 'paxta-galla' });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setForm({
      region: p.region ?? '',
      district: p.district ?? '',
      area: p.area ? String(p.area) : '',
      bonitet: p.bonitet ? String(p.bonitet) : '',
      water: String(p.water ?? 2),
      landType: p.landType ?? 'paxta-galla',
    });
  }, [data]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await api.put('/farm/profile', {
        region: form.region,
        district: form.district || undefined,
        area: form.area ? Number(form.area) : undefined,
        bonitet: form.bonitet ? Number(form.bonitet) : undefined,
        water: Number(form.water),
        landType: form.landType,
      });
      await refresh();
      setMsg('Saqlandi');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Yer ma’lumotlari</h2>
      <p className="mb-4 text-sm text-muted">Bu ma’lumotlar ob-havo signallari va maslahatlar uchun ishlatiladi.</p>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Tuman">
          <Input value={form.district} onChange={set('district')} maxLength={80} />
        </Field>
        <Field label="Umumiy maydon (ga)">
          <Input type="number" inputMode="decimal" min="0.01" step="0.01" value={form.area} onChange={set('area')} />
        </Field>
        <Field label="Ball bonitet">
          <Input type="number" inputMode="numeric" min="1" max="100" value={form.bonitet} onChange={set('bonitet')} />
        </Field>
        <Field label="Suv ta’minoti">
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
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" loading={saving}>
            Saqlash
          </Button>
          <Link to="/maslahat" className="text-sm font-semibold text-forest-700 hover:underline">
            Shu yer uchun maslahat olish →
          </Link>
          {msg && <span className="text-sm font-semibold text-forest-700">{msg}</span>}
        </div>
        {error && (
          <div className="sm:col-span-2">
            <ErrorBox message={error} />
          </div>
        )}
      </form>
    </Card>
  );
}

function Reminders() {
  const [showDone, setShowDone] = useState(false);
  const { data, loading, error, setData } = useApi<{ reminders: Reminder[] }>(`/me/reminders${showDone ? '?all=1' : ''}`);
  const list = data?.reminders ?? [];
  const overdue = list.filter((r) => !r.done && daysUntil(r.dueDate) < 0);
  const rest = list.filter((r) => !overdue.includes(r));
  const update = (r: Reminder) => setData((d) => (d ? { reminders: d.reminders.map((x) => (x.id === r.id ? r : x)) } : d));
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Eslatmalar</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-forest-700" /> Bajarilganlarni ham ko‘rsatish
        </label>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {overdue.length > 0 && (
        <>
          <p className="mt-2 text-sm font-semibold text-rose-700">Muddati o‘tgan ({overdue.length})</p>
          <ReminderList reminders={overdue} onChange={update} />
        </>
      )}
      {rest.length > 0 && <ReminderList reminders={rest} onChange={update} />}
      {!loading && list.length === 0 && <p className="py-6 text-center text-muted">Eslatmalar yo‘q</p>}
    </Card>
  );
}

function Notifications() {
  const { data, loading, reload } = useApi<{ notifications: Notification[]; unread: number }>('/me/notifications');
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-5 text-forest-700" /> Bildirishnomalar
        </h2>
        {data && data.unread > 0 && (
          <Button variant="ghost" onClick={() => api.post('/me/notifications/read-all').then(reload)}>
            Hammasini o‘qilgan deb belgilash
          </Button>
        )}
      </div>
      {loading && <Spinner />}
      <ul className="divide-y divide-line">
        {data?.notifications.map((n) => (
          <li key={n.id} className={cx('py-3', !n.read && 'font-semibold')}>
            <div className="flex items-start gap-2">
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-wheat" />}
              <div>
                <p>{n.title}</p>
                <p className="text-sm font-normal text-muted">{n.body}</p>
                <p className="text-xs font-normal text-muted">{relDay(n.createdAt)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {data?.notifications.length === 0 && <p className="py-6 text-center text-muted">Bildirishnomalar yo‘q</p>}
    </Card>
  );
}

const FAV_LINK: Record<Favorite['kind'], string> = { crop: '/ekinlar/', disease: '/kasalliklar/', article: '/maqolalar/' };
const FAV_LABEL: Record<Favorite['kind'], string> = { crop: 'Ekin', disease: 'Kasallik', article: 'Maqola' };

function Favorites() {
  const { data, loading } = useApi<{ favorites: Favorite[] }>('/me/favorites');
  if (loading) return <Spinner />;
  if (!data?.favorites.length)
    return (
      <Empty title="Saqlanganlar yo‘q" icon={<Heart className="size-10" />}>
        Ekin, kasallik yoki maqola sahifasida “Saqlash” tugmasini bosing.
      </Empty>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.favorites.map((f) => (
        <Link key={f.id} to={FAV_LINK[f.kind] + f.slug} className="flex items-center justify-between rounded-2xl border border-line bg-paper p-4 hover:bg-forest-50">
          <span className="font-semibold">{f.title}</span>
          <Badge>{FAV_LABEL[f.kind]}</Badge>
        </Link>
      ))}
    </div>
  );
}

export default function Cabinet() {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'umumiy') as Tab;
  const go = (t: Tab) => setParams(t === 'umumiy' ? {} : { tab: t });

  if (loading) return <Spinner />;
  if (!user)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <NeedLogin what="Shaxsiy kabinetdan foydalanish" />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-1">
        <p className="text-xs font-bold tracking-[0.18em] text-wheat-dark uppercase">Shaxsiy kabinet</p>
        <h1 className="text-3xl font-bold">Assalomu alaykum, {user.name.split(' ')[0]}!</h1>
      </div>
      <div className="-mx-4 mb-6 overflow-x-auto px-4">
        <div className="flex w-max gap-1 rounded-2xl bg-forest-100 p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} className={cx('rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap', tab === t.id ? 'bg-paper shadow-sm' : 'text-muted hover:text-ink')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'umumiy' && <Overview go={go} />}
      {tab === 'ekinlar' && <Plantings />}
      {tab === 'yer' && <ProfileForm />}
      {tab === 'eslatmalar' && <Reminders />}
      {tab === 'bildirishnomalar' && <Notifications />}
      {tab === 'saqlangan' && <Favorites />}
      <p className="mt-8 flex items-center gap-2 text-xs text-muted">
        <Wallet className="size-4" /> Barcha summalar so‘mda. Ma’lumotlaringiz faqat sizga ko‘rinadi.
      </p>
    </div>
  );
}
