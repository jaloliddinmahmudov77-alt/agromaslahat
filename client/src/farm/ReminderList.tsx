import { api } from '../lib/api';
import type { Reminder } from '../lib/types';
import { REMINDER_TYPES, daysUntil, fmtShortDate, relDay } from '../lib/format';
import { Badge, cx } from '../components/ui';

export function ReminderList({ reminders, onChange }: { reminders: Reminder[]; onChange: (r: Reminder) => void }) {
  async function toggle(r: Reminder) {
    onChange({ ...r, done: !r.done });
    await api.patch(`/me/reminders/${r.id}`, { done: !r.done }).catch(() => onChange(r));
  }
  return (
    <ul className="divide-y divide-line">
      {reminders.map((r) => {
        const n = daysUntil(r.dueDate);
        return (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <input type="checkbox" checked={r.done} onChange={() => toggle(r)} className="size-5 shrink-0 accent-forest-700" aria-label={`Bajarildi: ${r.title}`} />
            <div className={cx('min-w-0 flex-1', r.done && 'text-muted line-through')}>
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className={cx('text-xs', !r.done && n < 0 ? 'font-semibold text-rose-700' : 'text-muted')}>
                {fmtShortDate(r.dueDate)} · {relDay(r.dueDate)}
              </p>
            </div>
            <Badge className={REMINDER_TYPES[r.type]?.color}>{REMINDER_TYPES[r.type]?.label ?? r.type}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
