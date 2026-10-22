import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { Article } from '../lib/types';
import { fmtDate } from '../lib/format';
import { FavoriteButton } from '../components/FavoriteButton';
import { RichText } from '../components/RichText';
import { Badge, ErrorBox, Spinner } from '../components/ui';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { data, error, loading } = useApi<{ article: Article }>(`/articles/${slug}`);
  if (loading) return <Spinner />;
  if (error || !data)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorBox message={error ?? 'Topilmadi'} />
      </div>
    );
  const a = data.article;
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/maqolalar" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline">
        <ArrowLeft className="size-4" /> Maqolalar
      </Link>
      <div className="flex flex-wrap gap-2">
        <Badge>{a.category}</Badge>
        {a.season && <Badge className="bg-wheat/30 text-wheat-dark">{a.season}</Badge>}
      </div>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{a.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span>{fmtDate(a.publishedAt)}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-4" /> {a.readMinutes} daqiqa
        </span>
        <span>{a.views} marta o‘qilgan</span>
        <span className="ml-auto">
          <FavoriteButton kind="article" slug={a.slug} title={a.title} />
        </span>
      </div>
      <p className="mt-6 text-lg text-muted">{a.excerpt}</p>
      <div className="mt-6 text-lg">
        <RichText text={a.body} />
      </div>
    </article>
  );
}
