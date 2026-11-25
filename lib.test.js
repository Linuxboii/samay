import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offsetMinutes, zonedMidnight, dayGrid, bestHours, encodeState, decodeState, kind } from './lib.js';

test('offsetMinutes handles half-hour and DST zones', () => {
  const jan = Date.UTC(2026, 0, 15, 12);
  const jul = Date.UTC(2026, 6, 15, 12);
  assert.equal(offsetMinutes(jan, 'Asia/Kolkata'), 330);
  assert.equal(offsetMinutes(jan, 'America/New_York'), -300);
  assert.equal(offsetMinutes(jul, 'America/New_York'), -240);
  assert.equal(offsetMinutes(jan, 'UTC'), 0);
});

test('zonedMidnight returns the UTC instant of local midnight', () => {
  const t = zonedMidnight('2026-11-25', 'Asia/Kolkata');
  assert.equal(new Date(t).toISOString(), '2026-11-24T18:30:00.000Z');
});

test('dayGrid gives 24 rows with a local hour per zone', () => {
  const g = dayGrid('2026-11-25', ['Asia/Kolkata', 'Europe/London']);
  assert.equal(g.length, 24);
  assert.equal(g[0].cells[0].hour, 0);
  assert.equal(g[0].cells[1].hour, 18); // 00:00 IST = 18:30 London previous day
  assert.equal(g[0].cells[1].minute, 30);
  assert.equal(g[0].cells[1].dayShift, -1);
});

test('kind classifies hours', () => {
  assert.equal(kind(10), 'work');
  assert.equal(kind(20), 'awake');
  assert.equal(kind(3), 'night');
});

test('bestHours finds the shared working window', () => {
  const g = dayGrid('2026-11-25', ['Asia/Kolkata', 'Europe/Berlin']);
  const b = bestHours(g);
  assert.ok(b.length > 0);
  for (const i of b) for (const c of g[i].cells) assert.equal(kind(c.hour), 'work');
});

test('state round-trips through the URL hash', () => {
  const s = { zones: ['Asia/Kolkata', 'America/Los_Angeles'], date: '2026-11-25' };
  assert.deepEqual(decodeState(encodeState(s)), s);
});

test('decodeState ignores unknown zones', () => {
  const s = decodeState('#z=Asia/Kolkata,Mars/Base&d=2026-11-25');
  assert.deepEqual(s.zones, ['Asia/Kolkata']);
});
