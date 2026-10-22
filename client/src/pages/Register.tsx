import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMeta } from '../hooks/useApi';
import { Button, Card, ErrorBox, Field, Input, Select } from '../components/ui';

export default function Register() {
  const { user, register } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', region: '', district: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/kabinet" replace />;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ ...form, region: form.region || undefined, district: form.district || undefined });
      navigate('/kabinet');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Ro‘yxatdan o‘tish</h1>
      <p className="mb-6 text-muted">Bepul hisob oching — ekinlaringiz bo‘yicha signallar va mavsum hisobotini oling.</p>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Ism-familiya">
            <Input autoComplete="name" required minLength={2} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email">
            <Input type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Parol" hint="Kamida 8 belgi">
            <Input type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Viloyat">
              <Select value={form.region} onChange={set('region')}>
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
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" loading={loading} className="w-full">
            Hisob ochish
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        Hisobingiz bormi?{' '}
        <Link to="/kirish" className="font-semibold text-forest-700 underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
