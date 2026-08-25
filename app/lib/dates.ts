/** Local calendar date as YYYY-MM-DD */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole local days from epochDate (YYYY-MM-DD) to target (default today). */
export function daysSinceEpoch(epochDate: string, target = new Date()): number {
  const [ey, em, ed] = epochDate.split('-').map(Number);
  const epoch = new Date(ey, em - 1, ed);
  const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const ms = start.getTime() - epoch.getTime();
  return Math.floor(ms / 86_400_000);
}

export function addDays(epochDate: string, days: number): string {
  const [ey, em, ed] = epochDate.split('-').map(Number);
  const d = new Date(ey, em - 1, ed);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export function formatDisplayDate(key: string, locale: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
