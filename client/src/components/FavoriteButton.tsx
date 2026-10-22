import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Favorite } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { cx } from './ui';

export function FavoriteButton({ kind, slug, title }: { kind: Favorite['kind']; slug: string; title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ favorites: Favorite[] }>('/me/favorites')
      .then((r) => setSaved(r.favorites.some((f) => f.kind === kind && f.slug === slug)))
      .catch(() => {});
  }, [user, kind, slug]);

  async function toggle() {
    if (!user) return navigate('/kirish');
    setBusy(true);
    try {
      if (saved) await api.del(`/me/favorites/${kind}/${slug}`);
      else await api.post('/me/favorites', { kind, slug, title });
      setSaved(!saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
        saved ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-line bg-paper text-ink hover:bg-forest-50',
      )}
    >
      <Heart className={cx('size-4', saved && 'fill-current')} />
      {saved ? 'Saqlangan' : 'Saqlash'}
    </button>
  );
}
