import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, ErrorBox, Field, Input } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/kabinet" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/kabinet');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Kirish</h1>
      <p className="mb-6 text-muted">Shaxsiy kabinetingizga kiring.</p>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Parol">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <ErrorBox message={error} />}
          <Button type="submit" loading={loading} className="w-full">
            Kirish
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        Hisobingiz yo‘qmi?{' '}
        <Link to="/royxatdan-otish" className="font-semibold text-forest-700 underline">
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </div>
  );
}
