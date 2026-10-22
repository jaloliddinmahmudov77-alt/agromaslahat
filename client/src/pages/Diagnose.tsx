import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Droplets, FlaskConical, ImagePlus, PhoneCall, RotateCcw, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { fileToDataUrl } from '../lib/image';
import type { Diagnosis } from '../lib/types';
import { useMeta } from '../hooks/useApi';
import { AiOffNote, Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Textarea } from '../components/ui';

const CONF_COLOR: Record<string, string> = {
  yuqori: 'bg-forest-700 text-cream',
  'o‘rta': 'bg-wheat/30 text-wheat-dark',
  past: 'bg-rose-100 text-rose-800',
};

export default function Diagnose() {
  const meta = useMeta();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      setImage(await fileToDataUrl(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function analyze() {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.post<{ result: Diagnosis }>('/ai/diagnose', { image, crop: crop || undefined, note: note || undefined });
      setResult(r.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="AI tashxis" title="O‘simlik rasmini yuklang">
        Zararlangan barg yoki o‘simlikni yaqindan, yorug‘ joyda suratga oling. AgroAI muammoni aniqlab, nima qilish kerakligini aytadi.
      </PageHeader>

      {meta && !meta.aiEnabled && (
        <div className="mb-6">
          <AiOffNote />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {image ? (
            <div className="relative overflow-hidden rounded-xl bg-forest-50">
              <img src={image} alt="Yuklangan o‘simlik rasmi" className="max-h-80 w-full object-contain" />
              <button onClick={() => fileRef.current?.click()} className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-paper/90 px-3 py-1.5 text-sm font-semibold">
                <RotateCcw className="size-4" /> Boshqa rasm
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void pick(e.dataTransfer.files[0]);
              }}
              className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-forest-50 text-muted hover:border-forest-700"
            >
              <ImagePlus className="size-10 text-forest-700" />
              <span className="font-semibold text-ink">Rasm tanlang yoki suratga oling</span>
              <span className="text-sm">JPG, PNG — telefondan to‘g‘ridan-to‘g‘ri</span>
            </button>
          )}
          <Field label="Ekin (ixtiyoriy)">
            <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Masalan: paxta" maxLength={60} />
          </Field>
          <Field label="Izoh (ixtiyoriy)">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qachondan beri, qancha maydonda, oxirgi sug‘orish…" maxLength={1000} />
          </Field>
          <Button onClick={analyze} disabled={!image || meta?.aiEnabled === false} loading={loading}>
            <Camera className="size-4" /> {loading ? 'Tahlil qilinmoqda…' : 'Tashxis qo‘yish'}
          </Button>
        </Card>

        <div className="space-y-4">
          {error && <ErrorBox message={error} />}
          {!result && !error && (
            <Card className="text-muted">
              <p className="font-semibold text-ink">Yaxshi rasm uchun maslahatlar</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Bitta barg yoki o‘simlik kadrda katta ko‘rinsin</li>
                <li>Kunduzi, soyada, yorug‘ joyda suratga oling</li>
                <li>Ham ustki, ham ostki tomonini ko‘rsating</li>
                <li>Izohda ekin nomi va belgilar qachon paydo bo‘lganini yozing</li>
              </ul>
            </Card>
          )}
          {result && (
            <>
              <Card className={result.healthy ? 'border-forest-700' : 'border-rose-300'}>
                <p className="text-sm text-muted">{result.plant}</p>
                <h2 className="text-2xl font-bold">{result.problem}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{result.kind}</Badge>
                  <Badge className={CONF_COLOR[result.confidence]}>Ishonch: {result.confidence}</Badge>
                </div>
                {result.signs.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                    {result.signs.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                {result.matchSlug && (
                  <Link to={`/kasalliklar/${result.matchSlug}`} className="mt-3 inline-block text-sm font-semibold text-forest-700 underline">
                    Bu kasallik haqida batafsil →
                  </Link>
                )}
              </Card>
              <Card>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-5 text-forest-700" /> Nima qilish kerak
                </h3>
                <ol className="list-decimal space-y-1 pl-5 text-muted">
                  {result.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <h3 className="mb-1 flex items-center gap-2 font-semibold">
                    <Droplets className="size-5 text-sky-700" /> Sug‘orish
                  </h3>
                  <p className="text-sm text-muted">{result.water}</p>
                </Card>
                <Card>
                  <h3 className="mb-1 flex items-center gap-2 font-semibold">
                    <FlaskConical className="size-5 text-wheat-dark" /> O‘g‘it
                  </h3>
                  <p className="text-sm text-muted">{result.fertilizer}</p>
                </Card>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-wheat/50 bg-wheat/10 p-4 text-sm">
                <PhoneCall className="mt-0.5 size-5 shrink-0 text-wheat-dark" />
                <p>{result.whenExpert}</p>
              </div>
              <p className="text-xs text-muted">AI tashxisi taxminiy. Muhim qarorlardan oldin agronom bilan maslahatlashing.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
