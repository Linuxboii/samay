import { dayGrid, bestHours, encodeState, decodeState, kind, isZone } from './lib.js';
import { $, copy, toast } from './ui.js';

const all = [...new Set((Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []).concat('UTC'))];
const city = (tz) => tz.split('/').pop().replace(/_/g, ' ');
const label = (tz) => `${city(tz)} (${tz})`;
const byLabel = new Map(all.map((tz) => [label(tz).toLowerCase(), tz]));

const dl = $('#tzlist');
for (const tz of all) dl.append(new Option(label(tz)));

const LEGACY = { 'Asia/Calcutta': 'Asia/Kolkata', 'Asia/Katmandu': 'Asia/Kathmandu', 'Asia/Saigon': 'Asia/Ho_Chi_Minh', 'Asia/Rangoon': 'Asia/Yangon', 'Europe/Kiev': 'Europe/Kyiv' };
const sysZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const local = isZone(LEGACY[sysZone] || '') ? LEGACY[sysZone] : sysZone;
const today = () => new Date().toLocaleDateString('en-CA');
const fromHash = decodeState(location.hash);
const state = {
  zones: fromHash.zones.length ? fromHash.zones : [local, 'Europe/London', 'America/New_York'].filter((z, i, a) => a.indexOf(z) === i),
  date: fromHash.date || today(),
};

function resolve(input) {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (byLabel.has(s)) return byLabel.get(s);
  const exact = all.find((tz) => tz.toLowerCase() === s || city(tz).toLowerCase() === s);
  if (exact) return exact;
  return all.find((tz) => city(tz).toLowerCase().startsWith(s)) || null;
}

const pad = (n) => String(n).padStart(2, '0');
const abbr = (tz, t) => new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(t).find((p) => p.type === 'timeZoneName')?.value || tz;

function render() {
  history.replaceState(null, '', encodeState(state));
  const zones = $('#zones');
  zones.replaceChildren(...state.zones.map((tz, i) => {
    const c = document.createElement('span');
    c.className = 'chip';
    c.textContent = city(tz);
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Remove';
    b.setAttribute('aria-label', `Remove ${city(tz)}`);
    b.onclick = () => { state.zones.splice(i, 1); render(); };
    if (state.zones.length > 1) c.append(b);
    return c;
  }));
  $('#date').value = state.date;

  const grid = dayGrid(state.date, state.zones);
  const best = new Set(bestHours(grid));
  const head = $('#head');
  head.replaceChildren(...state.zones.map((tz) => {
    const th = document.createElement('th');
    th.textContent = `${city(tz)} ${abbr(tz, grid[12].t)}`;
    return th;
  }));
  $('#body').replaceChildren(...grid.map((row, i) => {
    const tr = document.createElement('tr');
    if (best.has(i)) tr.className = 'best';
    tr.tabIndex = 0;
    for (const c of row.cells) {
      const td = document.createElement('td');
      td.className = kind(c.hour);
      td.textContent = `${pad(c.hour)}:${pad(c.minute)}`;
      if (c.dayShift) {
        const s = document.createElement('sup');
        s.textContent = c.dayShift > 0 ? '+1 day' : '-1 day';
        td.append(s);
      }
      tr.append(td);
    }
    const text = () => row.cells.map((c) => `${city(c.tz)} ${pad(c.hour)}:${pad(c.minute)}${c.dayShift ? (c.dayShift > 0 ? ' (next day)' : ' (previous day)') : ''}`).join(' / ');
    tr.onclick = () => copy(text(), 'Time copied');
    tr.onkeydown = (e) => { if (e.key === 'Enter') copy(text(), 'Time copied'); };
    return tr;
  }));

  const allWork = [...best].every((i) => grid[i].cells.every((c) => kind(c.hour) === 'work'));
  const first = grid[[...best][0]];
  $('#best').textContent = state.zones.length < 2 ? 'Add a second place to compare.'
    : allWork ? `${best.size} hour${best.size > 1 ? 's' : ''} where everyone is at work, starting ${first.cells.map((c) => `${pad(c.hour)}:${pad(c.minute)} in ${city(c.tz)}`).join(', ')}.`
    : 'No hour falls inside everyone\'s working day. Marked rows keep the most people awake.';
}

function add() {
  const tz = resolve($('#search').value);
  const err = $('#err');
  if (!tz || !isZone(tz)) { err.textContent = 'No matching time zone. Try a big city near you, like Mumbai or Chicago.'; return; }
  err.textContent = '';
  if (!state.zones.includes(tz)) state.zones.push(tz);
  $('#search').value = '';
  render();
}

$('#add').onclick = add;
$('#search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
$('#date').addEventListener('change', (e) => { if (e.target.value) { state.date = e.target.value; render(); } });
$('#share').onclick = () => copy(location.href, 'Link copied');
window.addEventListener('hashchange', () => {
  const s = decodeState(location.hash);
  if (s.zones.length) state.zones = s.zones;
  if (s.date) state.date = s.date;
  render();
});
render();
if (!fromHash.zones.length) toast('Showing your zone, London and New York');
