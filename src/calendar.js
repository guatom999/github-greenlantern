const DAY_MS = 86_400_000;

/** Parse a date without silently accepting invalid days such as February 30. */
function dateNumber(value) {
  const time = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? Date.parse(`${value}T00:00:00Z`) : NaN;
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid calendar date; expected a real YYYY-MM-DD date.');
  }
  return time;
}

/** Dense column-major calendar. Null dates represent positions absent in the source. */
export function normalizeDays(days) {
  if (!Array.isArray(days) || days.length === 0) throw new Error('The calendar contains no days.');
  const seen = new Set();
  const sorted = days.map(day => {
    if (!day || typeof day !== 'object') throw new Error('Invalid calendar day.');
    const time = dateNumber(day.date);
    if (seen.has(day.date)) throw new Error('Duplicate date in the calendar.');
    seen.add(day.date);
    if (!Number.isInteger(day.level) || day.level < 0 || day.level > 4) throw new Error('Contribution level must be an integer from 0 to 4.');
    if (day.count !== undefined && (!Number.isSafeInteger(day.count) || day.count < 0)) throw new Error('Contribution count must be a nonnegative integer.');
    return { ...day, time };
  }).sort((a, b) => a.time - b.time);
  const first = sorted[0];
  const last = sorted.at(-1);
  if ((last.time - first.time) / DAY_MS > 371) throw new Error('Calendar must cover at most one year of contribution weeks.');
  const origin = first.time - new Date(first.time).getUTCDay() * DAY_MS;
  const width = Math.floor((last.time - origin) / (7 * DAY_MS)) + 1;
  const cells = Array.from({ length: width * 7 }, (_, i) => ({ x: Math.floor(i / 7), y: i % 7, date: null, level: 0 }));
  for (const day of sorted) {
    const position = Math.round((day.time - origin) / DAY_MS);
    const cell = { x: Math.floor(position / 7), y: position % 7, date: day.date, level: day.level };
    if (day.count !== undefined) cell.count = day.count;
    cells[position] = cell;
  }
  return { width, height: 7, cells, from: first.date, to: last.date };
}
