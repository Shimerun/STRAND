import { site } from '../../data/site.js';
import { formatDuration, formatLongDay, formatPrice } from '../../lib/format.js';

// Live recap of the visit: barber, services, date and time, length and total.
export default function BookingSummary({ form, className = '' }) {
  const { summary } = site.ui.form;
  const { services, durationMin } = form.extras;
  const barber = site.team.find(({ slug }) => slug === form.barber);
  const date = form.values.date ? formatLongDay(form.values.date) : null;

  const rows = [
    [summary.barber, barber?.name],
    [summary.services, services.length ? services.map(({ name }) => name) : null],
    [summary.when, date && [date, form.time].filter(Boolean).join(' · ')],
    [summary.duration, services.length ? formatDuration(durationMin) : null],
  ];

  return (
    <aside aria-label={summary.title} className={`rounded border border-line p-4 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-heading text-concrete">{summary.title}</p>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="shrink-0 text-concrete">{label}</dt>
            <dd className="text-right font-bold">
              {Array.isArray(value)
                ? value.map((item) => (
                    <span key={item} className="block">
                      {item}
                    </span>
                  ))
                : value || summary.empty}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <span className="text-xs font-medium uppercase tracking-heading text-concrete">{summary.total}</span>
        <span className="text-2xl font-extrabold">
          {form.price ? formatPrice(form.price.value, { from: form.price.from }) : summary.empty}
        </span>
      </div>
    </aside>
  );
}
