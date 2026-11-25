// Timezone math on top of Intl. No DOM.

const fmtCache = new Map();
function parts(ms, tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    fmtCache.set(tz, f);
  }
  const o = {};
  for (const p of f.formatToParts(ms)) o[p.type] = p.value;
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute };
}

export function isZone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

/** Minutes ahead of UTC for tz at instant ms. */
export function offsetMinutes(ms, tz) {
  const p = parts(ms, tz);
  const asUTC = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
  return Math.round((asUTC - Math.floor(ms / 60000) * 60000) / 60000);
}

/** UTC instant of 00:00 on dateStr (YYYY-MM-DD) in tz. */
export function zonedMidnight(dateStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - offsetMinutes(guess, tz) * 60000;
  t = guess - offsetMinutes(t, tz) * 60000; // settle across a DST edge
  return t;
}

export const kind = (h) => (h >= 9 && h < 18 ? 'work' : h >= 7 && h < 23 ? 'awake' : 'night');

/** 24 hourly rows starting at local midnight of the first zone. */
export function dayGrid(dateStr, zones) {
  const start = zonedMidnight(dateStr, zones[0]);
  const base = parts(start, zones[0]);
  const baseDay = Date.UTC(base.y, base.mo - 1, base.d);
  const rows = [];
  for (let i = 0; i < 24; i++) {
    const t = start + i * 3600000;
    rows.push({
      t,
      cells: zones.map((tz) => {
        const p = parts(t, tz);
        return { tz, hour: p.h, minute: p.mi, dayShift: Math.round((Date.UTC(p.y, p.mo - 1, p.d) - baseDay) / 86400000) };
      }),
    });
  }
  return rows;
}

/** Row indexes where everyone is in working hours, else where the fewest are asleep. */
export function bestHours(grid) {
  const score = (r) => r.cells.reduce((s, c) => s + ({ work: 2, awake: 1, night: -3 })[kind(c.hour)], 0);
  const allWork = grid.map((r, i) => (r.cells.every((c) => kind(c.hour) === 'work') ? i : -1)).filter((i) => i >= 0);
  if (allWork.length) return allWork;
  const max = Math.max(...grid.map(score));
  return grid.map((r, i) => (score(r) === max ? i : -1)).filter((i) => i >= 0);
}

export function encodeState({ zones, date }) {
  return `#z=${zones.map(encodeURIComponent).join(',')}&d=${date}`;
}

export function decodeState(hash) {
  const q = new URLSearchParams(hash.replace(/^#/, ''));
  const zones = (q.get('z') || '').split(',').map(decodeURIComponent).filter((z) => z && isZone(z));
  const d = q.get('d');
  return { zones, date: /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : null };
}
