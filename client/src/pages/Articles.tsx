import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { ArticleListItem } from '../lib/types';
import { Badge, ErrorBox, PageHeader, Spinner } from '../components/ui';

export default function Articles() {
  const { data, error, loading, reload } = useApi<{ articles: ArticleListItem[] }>('/articles');
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Bilimlar" title="Maqolalar">
        Fermerlar uchun amaliy maslahatlar va mavsumiy tavsiyalar.
      </PageHeader>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.articles.map((a) => (
          <Link key={a.slug} to={`/maqolalar/${a.slug}`} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex flex-wrap gap-2">
              <Badge>{a.category}</Badge>
              {a.season && <Badge className="bg-wheat/30 text-wheat-dark">{a.season}</Badge>}
            </div>
            <h2 className="text-xl font-semibold">{a.title}</h2>
            <p className="text-muted">{a.excerpt}</p>
            <p className="mt-auto flex items-center gap-1 text-sm text-muted">
              <Clock className="size-4" /> {a.readMinutes} daqiqa
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
