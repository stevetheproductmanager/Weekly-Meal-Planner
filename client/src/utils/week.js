// ---- Week helpers (UTC-based, weeks start Monday) ----

export function getThisMonday() {
  const d = new Date();
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export function addWeeks(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

export function formatWeekRange(iso) {
  const mon = new Date(iso + 'T00:00:00Z');
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', fmt)}`;
}
