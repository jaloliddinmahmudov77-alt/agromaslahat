import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-forest-900 text-cream hover:bg-forest-800',
  secondary: 'bg-paper text-ink border border-line hover:bg-forest-50',
  ghost: 'text-forest-900 hover:bg-forest-100',
  accent: 'bg-wheat text-ink hover:brightness-95',
  danger: 'bg-paper text-rose-700 border border-rose-200 hover:bg-rose-50',
};

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-paper p-5', className)}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none transition placeholder:text-stone-400 focus:border-forest-700 focus:ring-2 focus:ring-forest-700/20';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'resize-y', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'appearance-auto', props.className)} />;
}

export function Spinner({ label = 'Yuklanmoqda…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted">
      <Loader2 className="size-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1 text-sm font-semibold underline">
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
      {icon && <div className="text-forest-700">{icon}</div>}
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.18em] text-wheat-dark uppercase">{eyebrow}</p>}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', className ?? 'bg-forest-100 text-forest-900')}>{children}</span>;
}

export function NeedLogin({ what }: { what: string }) {
  return (
    <Empty title="Tizimga kiring" icon={<span className="text-4xl">🔐</span>}>
      <p>{what} uchun hisobingizga kiring yoki bepul ro‘yxatdan o‘ting.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link to="/kirish" className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-cream">
          Kirish
        </Link>
        <Link to="/royxatdan-otish" className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold">
          Ro‘yxatdan o‘tish
        </Link>
      </div>
    </Empty>
  );
}

export function AiOffNote() {
  return (
    <div className="rounded-2xl border border-wheat/50 bg-wheat/10 p-4 text-sm text-ink">
      <b>AgroAI hali ulanmagan.</b> Administrator serverdagi <code className="rounded bg-white px-1">GEMINI_API_KEY</code> ni sozlagach, sun’iy intellekt funksiyalari ishga tushadi.
    </div>
  );
}
