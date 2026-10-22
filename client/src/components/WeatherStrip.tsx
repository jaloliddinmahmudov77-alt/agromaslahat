import type { Weather } from '../lib/types';
import { fmtShortDate, weatherIcon, weekday } from '../lib/format';

export function WeatherStrip({ weather }: { weather: Weather }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-muted">Ob-havo — {weather.place}, 7 kun</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {weather.days.map((d) => {
          const [icon, label] = weatherIcon(d.code);
          return (
            <div key={d.date} className="rounded-xl bg-forest-50 p-2 text-center" title={label}>
              <p className="text-xs font-semibold text-muted">{weekday(d.date)}</p>
              <p className="text-[11px] text-muted">{fmtShortDate(d.date)}</p>
              <p className="my-1 text-2xl" aria-label={label}>
                {icon}
              </p>
              <p className="text-sm font-bold">{Math.round(d.tMax)}°</p>
              <p className="text-xs text-muted">{Math.round(d.tMin)}°</p>
              {d.rainMm > 0.4 && <p className="mt-0.5 text-[11px] font-semibold text-sky-700">{d.rainMm.toFixed(0)} mm</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
